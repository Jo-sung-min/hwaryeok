package com.hwaryeok.usagevideo;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/** Parse only: submitted links are never fetched by the application. */
final class YoutubeLinks {

    private static final Set<String> VIDEO_HOSTS = Set.of("youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be");
    private static final Set<String> CHANNEL_HOSTS = Set.of("youtube.com", "www.youtube.com", "m.youtube.com");
    private static final Pattern VIDEO_ID = Pattern.compile("[A-Za-z0-9_-]{11}");
    private static final Pattern CHANNEL_PATH = Pattern.compile(
            "/(?:@[\\p{L}\\p{N}._·-]{1,100}|channel/UC[A-Za-z0-9_-]{22}|(?:c|user)/[\\p{L}\\p{N}._-]{1,100})/?");

    private YoutubeLinks() {}

    static VideoLink video(String value) {
        URI uri = parse(value, true);
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        if (!VIDEO_HOSTS.contains(host)) throw invalidVideo();
        String path = uri.getRawPath();
        String id;
        if (host.equals("youtu.be") || host.equals("www.youtu.be")) {
            id = path != null && path.matches("/[A-Za-z0-9_-]{11}/?")
                    ? path.substring(1).replaceAll("/$", "") : null;
        } else if ("/watch".equals(path)) {
            List<String> ids = new ArrayList<>();
            if (uri.getRawQuery() != null) {
                for (String part : uri.getRawQuery().split("&")) {
                    if (part.startsWith("v=")) ids.add(part.substring(2));
                }
            }
            id = ids.size() == 1 ? ids.getFirst() : null;
        } else {
            var matcher = Pattern.compile("/(?:shorts|embed|live)/([A-Za-z0-9_-]{11})/?").matcher(path == null ? "" : path);
            id = matcher.matches() ? matcher.group(1) : null;
        }
        if (id == null || !VIDEO_ID.matcher(id).matches()) throw invalidVideo();
        return new VideoLink("https://www.youtube.com/watch?v=" + id, id);
    }

    static String channel(String value) {
        URI uri = parse(value, false);
        if (!CHANNEL_HOSTS.contains(uri.getHost().toLowerCase(Locale.ROOT))
                || uri.getRawQuery() != null || uri.getRawFragment() != null) {
            throw invalidChannel();
        }
        // getPath supports ordinary Korean handles while the anchored pattern rejects encoded separators.
        String path = uri.getPath();
        if (path == null || !CHANNEL_PATH.matcher(path).matches()) throw invalidChannel();
        path = path.replaceAll("/$", "");
        try {
            return new URI("https", "www.youtube.com", path, null).toASCIIString();
        } catch (URISyntaxException exception) {
            throw invalidChannel();
        }
    }

    private static URI parse(String value, boolean video) {
        if (value == null || value.isBlank() || value.length() > 2048) throw video ? invalidVideo() : invalidChannel();
        try {
            URI uri = new URI(value.trim());
            String scheme = uri.getScheme();
            if (scheme == null || !("https".equalsIgnoreCase(scheme) || video && "http".equalsIgnoreCase(scheme))
                    || uri.getHost() == null || uri.getUserInfo() != null || uri.getPort() != -1) {
                throw video ? invalidVideo() : invalidChannel();
            }
            return uri;
        } catch (URISyntaxException exception) {
            throw video ? invalidVideo() : invalidChannel();
        }
    }

    private static IllegalArgumentException invalidVideo() {
        return new IllegalArgumentException("유효한 유튜브 영상 링크를 입력해 주세요. 영상, Shorts, 공유 링크만 등록할 수 있어요.");
    }

    private static IllegalArgumentException invalidChannel() {
        return new IllegalArgumentException("https://www.youtube.com/@채널명 형식의 유튜브 채널 링크를 입력해 주세요.");
    }

    record VideoLink(String url, String id) {}
}
