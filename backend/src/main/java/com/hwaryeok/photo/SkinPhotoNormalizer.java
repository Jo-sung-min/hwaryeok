package com.hwaryeok.photo;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import org.springframework.stereotype.Component;

@Component
public class SkinPhotoNormalizer {
    public static final int MAX_BYTES = 5 * 1024 * 1024;

    public byte[] normalize(byte[] input) {
        if (input.length == 0 || input.length > MAX_BYTES) throw invalid();
        // Explicit memory streams: neither the upload nor ImageIO cache is written to disk.
        try (var stream = new MemoryCacheImageInputStream(new ByteArrayInputStream(input))) {
            var readers = ImageIO.getImageReaders(stream);
            if (!readers.hasNext()) throw invalid();
            var reader = readers.next();
            try {
                String format = reader.getFormatName();
                if (!format.equalsIgnoreCase("JPEG") && !format.equalsIgnoreCase("PNG")) throw invalid();
                reader.setInput(stream, true, true);
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 256 || height < 256 || (long) width * height > 20_000_000L) throw invalid();
                BufferedImage original = reader.read(0);
                double scale = Math.min(1, 1024.0 / Math.max(width, height));
                var resized = new BufferedImage(Math.max(1, (int) (width * scale)), Math.max(1, (int) (height * scale)), BufferedImage.TYPE_INT_RGB);
                var graphics = resized.createGraphics();
                try {
                    graphics.setColor(Color.WHITE);
                    graphics.fillRect(0, 0, resized.getWidth(), resized.getHeight());
                    graphics.drawImage(original, 0, 0, resized.getWidth(), resized.getHeight(), null);
                } finally { graphics.dispose(); original.flush(); }
                var bytes = new ByteArrayOutputStream();
                try (var output = new MemoryCacheImageOutputStream(bytes)) {
                    if (!ImageIO.write(resized, "JPEG", output)) throw invalid();
                } finally { resized.flush(); }
                return bytes.toByteArray();
            } finally { reader.dispose(); }
        } catch (PhotoAnalysisException ex) { throw ex;
        } catch (Exception ex) { throw invalid(); }
    }

    private PhotoAnalysisException invalid() {
        return new PhotoAnalysisException(400, "INVALID_PHOTO", "가로·세로 256px 이상, 2천만 화소 이하의 JPEG·PNG 사진(5MB 이하)을 선택해 주세요.");
    }
}
