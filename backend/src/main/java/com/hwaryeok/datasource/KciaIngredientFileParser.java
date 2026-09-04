package com.hwaryeok.datasource;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;

import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

@Component
class KciaIngredientFileParser {

    private static final int MAX_ROWS = 50_000;
    private static final int MAX_UNCOMPRESSED_BYTES = 60 * 1024 * 1024;

    List<KciaIngredientRow> parse(byte[] data) {
        if (data == null || data.length == 0) throw new IllegalArgumentException("성분사전 파일을 선택해 주세요.");
        List<List<String>> rows = isZip(data) ? parseXlsx(data) : parseCsv(data);
        return toIngredients(rows);
    }

    private List<KciaIngredientRow> toIngredients(List<List<String>> rows) {
        int headerIndex = -1;
        Map<String, Integer> columns = Map.of();
        for (int index = 0; index < Math.min(rows.size(), 30); index++) {
            Map<String, Integer> candidate = headerColumns(rows.get(index));
            if (findColumn(candidate, "성분코드", "code") != null
                    && findColumn(candidate, "성분명", "표준명", "표준화명칭") != null) {
                headerIndex = index;
                columns = candidate;
                break;
            }
        }
        if (headerIndex < 0) {
            throw new IllegalArgumentException("성분코드와 성분명 열을 찾지 못했어요. 협회 공식 CSV/XLSX 양식을 확인해 주세요.");
        }

        Integer codeColumn = findColumn(columns, "성분코드", "code");
        Integer nameColumn = findColumn(columns, "성분명", "표준명", "표준화명칭");
        Integer englishColumn = findColumn(columns, "영문명", "inciname", "englishname");
        Integer casColumn = findColumn(columns, "casno", "cas번호");
        Integer formerColumn = findColumn(columns, "구명칭", "구명", "이전명칭");

        Map<String, KciaIngredientRow> unique = new LinkedHashMap<>();
        for (int index = headerIndex + 1; index < rows.size() && unique.size() < MAX_ROWS; index++) {
            List<String> row = rows.get(index);
            String code = cell(row, codeColumn);
            String name = cell(row, nameColumn);
            if (code.isBlank() || name.isBlank()) continue;
            unique.put(code, new KciaIngredientRow(
                    code,
                    name,
                    cell(row, englishColumn),
                    cell(row, casColumn),
                    cell(row, formerColumn)
            ));
        }
        if (unique.isEmpty()) throw new IllegalArgumentException("적재할 성분 행을 찾지 못했어요.");
        return List.copyOf(unique.values());
    }

    private Map<String, Integer> headerColumns(List<String> row) {
        Map<String, Integer> result = new HashMap<>();
        for (int index = 0; index < row.size(); index++) {
            String header = normalizeHeader(row.get(index));
            if (!header.isBlank()) result.put(header, index);
        }
        return result;
    }

    private Integer findColumn(Map<String, Integer> columns, String... candidates) {
        for (String candidate : candidates) {
            Integer index = columns.get(normalizeHeader(candidate));
            if (index != null) return index;
        }
        return null;
    }

    private String normalizeHeader(String value) {
        return clean(value).toLowerCase(Locale.ROOT).replaceAll("[\\s._()·ㆍ/-]", "");
    }

    private String cell(List<String> row, Integer index) {
        return index == null || index < 0 || index >= row.size() ? "" : clean(row.get(index));
    }

    private List<List<String>> parseCsv(byte[] data) {
        String text = decodeCsv(data);
        if (!text.isEmpty() && text.charAt(0) == '\ufeff') text = text.substring(1);
        char separator = firstLine(text).contains("\t") ? '\t' : ',';
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean quoted = false;
        for (int index = 0; index < text.length(); index++) {
            char current = text.charAt(index);
            if (current == '"') {
                if (quoted && index + 1 < text.length() && text.charAt(index + 1) == '"') {
                    cell.append('"');
                    index++;
                } else {
                    quoted = !quoted;
                }
            } else if (current == separator && !quoted) {
                row.add(cell.toString());
                cell.setLength(0);
            } else if ((current == '\n' || current == '\r') && !quoted) {
                if (current == '\r' && index + 1 < text.length() && text.charAt(index + 1) == '\n') index++;
                row.add(cell.toString());
                cell.setLength(0);
                if (row.stream().anyMatch(value -> !value.isBlank())) rows.add(List.copyOf(row));
                row.clear();
            } else {
                cell.append(current);
            }
        }
        row.add(cell.toString());
        if (row.stream().anyMatch(value -> !value.isBlank())) rows.add(List.copyOf(row));
        return rows;
    }

    private List<List<String>> parseXlsx(byte[] data) {
        Map<String, byte[]> entries = unzipRequiredEntries(data);
        byte[] worksheet = entries.entrySet().stream()
                .filter(entry -> entry.getKey().startsWith("xl/worksheets/sheet") && entry.getKey().endsWith(".xml"))
                .sorted(Map.Entry.comparingByKey())
                .map(Map.Entry::getValue)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("XLSX 첫 번째 시트를 찾지 못했어요."));
        List<String> sharedStrings = entries.containsKey("xl/sharedStrings.xml")
                ? readSharedStrings(entries.get("xl/sharedStrings.xml"))
                : List.of();
        Document document = readXml(worksheet);
        NodeList rowNodes = document.getElementsByTagNameNS("*", "row");
        List<List<String>> rows = new ArrayList<>();
        for (int rowIndex = 0; rowIndex < rowNodes.getLength() && rows.size() < MAX_ROWS + 30; rowIndex++) {
            Element rowElement = (Element) rowNodes.item(rowIndex);
            NodeList cellNodes = rowElement.getElementsByTagNameNS("*", "c");
            Map<Integer, String> values = new HashMap<>();
            int largestColumn = -1;
            for (int cellIndex = 0; cellIndex < cellNodes.getLength(); cellIndex++) {
                Element cell = (Element) cellNodes.item(cellIndex);
                int column = columnIndex(cell.getAttribute("r"));
                String value = xlsxCellValue(cell, sharedStrings);
                values.put(column, value);
                largestColumn = Math.max(largestColumn, column);
            }
            List<String> row = new ArrayList<>();
            for (int column = 0; column <= largestColumn; column++) row.add(values.getOrDefault(column, ""));
            if (row.stream().anyMatch(value -> !value.isBlank())) rows.add(List.copyOf(row));
        }
        return rows;
    }

    private Map<String, byte[]> unzipRequiredEntries(byte[] data) {
        Map<String, byte[]> entries = new HashMap<>();
        int total = 0;
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(data))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                String name = entry.getName();
                if (name.equals("xl/sharedStrings.xml")
                        || (name.startsWith("xl/worksheets/sheet") && name.endsWith(".xml"))) {
                    byte[] content = readEntry(zip, total);
                    total += content.length;
                    entries.put(name, content);
                }
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("XLSX 파일을 읽을 수 없어요.");
        }
        return entries;
    }

    private byte[] readEntry(ZipInputStream zip, int bytesReadBefore) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int read;
        while ((read = zip.read(buffer)) != -1) {
            if (bytesReadBefore + output.size() + read > MAX_UNCOMPRESSED_BYTES) {
                throw new IllegalArgumentException("압축 해제된 XLSX 파일이 너무 커요.");
            }
            output.write(buffer, 0, read);
        }
        return output.toByteArray();
    }

    private List<String> readSharedStrings(byte[] data) {
        Document document = readXml(data);
        NodeList stringItems = document.getElementsByTagNameNS("*", "si");
        List<String> result = new ArrayList<>();
        for (int index = 0; index < stringItems.getLength(); index++) {
            Element item = (Element) stringItems.item(index);
            NodeList texts = item.getElementsByTagNameNS("*", "t");
            StringBuilder value = new StringBuilder();
            for (int textIndex = 0; textIndex < texts.getLength(); textIndex++) {
                value.append(texts.item(textIndex).getTextContent());
            }
            result.add(value.toString());
        }
        return result;
    }

    private String xlsxCellValue(Element cell, List<String> sharedStrings) {
        String type = cell.getAttribute("t");
        if ("inlineStr".equals(type)) {
            NodeList texts = cell.getElementsByTagNameNS("*", "t");
            StringBuilder result = new StringBuilder();
            for (int index = 0; index < texts.getLength(); index++) result.append(texts.item(index).getTextContent());
            return result.toString();
        }
        NodeList values = cell.getElementsByTagNameNS("*", "v");
        if (values.getLength() == 0) return "";
        String value = values.item(0).getTextContent();
        if ("s".equals(type)) {
            try {
                int sharedIndex = Integer.parseInt(value);
                return sharedIndex >= 0 && sharedIndex < sharedStrings.size() ? sharedStrings.get(sharedIndex) : "";
            } catch (NumberFormatException ignored) {
                return "";
            }
        }
        return value;
    }

    private Document readXml(byte[] data) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            return factory.newDocumentBuilder().parse(new ByteArrayInputStream(data));
        } catch (Exception exception) {
            throw new IllegalArgumentException("XLSX 내부 문서를 안전하게 읽지 못했어요.");
        }
    }

    private int columnIndex(String reference) {
        int result = 0;
        int letters = 0;
        while (letters < reference.length() && Character.isLetter(reference.charAt(letters))) {
            result = result * 26 + (Character.toUpperCase(reference.charAt(letters)) - 'A' + 1);
            letters++;
        }
        return Math.max(0, result - 1);
    }

    private boolean isZip(byte[] data) {
        return data.length >= 4 && data[0] == 'P' && data[1] == 'K' && data[2] == 3 && data[3] == 4;
    }

    private String firstLine(String value) {
        int newline = value.indexOf('\n');
        return newline < 0 ? value : value.substring(0, newline);
    }

    private String decodeCsv(byte[] data) {
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(data))
                    .toString();
        } catch (CharacterCodingException exception) {
            return Charset.forName("MS949").decode(ByteBuffer.wrap(data)).toString();
        }
    }

    private String clean(String value) {
        return value == null ? "" : value.replace('\u00a0', ' ').strip();
    }
}
