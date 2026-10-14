import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class GateSimulator {
    private static final String DEFAULT_BACKEND_URL = "http://localhost:8080";
    private static final String VERIFY_PATH = "/api/gate-pins/verify";
    private static final Pattern MESSAGE_FIRST_RESPONSE = Pattern.compile(
            "^\\s*\\{\\s*\\\"message\\\"\\s*:\\s*\\\"((?:\\\\.|[^\\\"\\\\])*)\\\"\\s*,\\s*\\\"success\\\"\\s*:\\s*(true|false)\\s*}\\s*$");
    private static final Pattern SUCCESS_FIRST_RESPONSE = Pattern.compile(
            "^\\s*\\{\\s*\\\"success\\\"\\s*:\\s*(true|false)\\s*,\\s*\\\"message\\\"\\s*:\\s*\\\"((?:\\\\.|[^\\\"\\\\])*)\\\"\\s*}\\s*$");

    private final HttpClient httpClient;
    private final URI verifyUri;

    private GateSimulator(String backendUrl) {
        String normalizedUrl = backendUrl.replaceAll("/+$", "");
        this.verifyUri = URI.create(normalizedUrl + VERIFY_PATH);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    public static void main(String[] args) {
        String backendUrl = args.length > 0 ? args[0] : DEFAULT_BACKEND_URL;
        GateSimulator simulator;
        try {
            simulator = new GateSimulator(backendUrl);
        } catch (IllegalArgumentException exception) {
            System.out.println("Backend URL không hợp lệ: " + backendUrl);
            return;
        }

        System.out.println("Gate Terminal Simulator");
        System.out.println("Backend: " + backendUrl);
        try (Scanner scanner = new Scanner(System.in)) {
            while (true) {
                System.out.println("\n1. Nhập PIN để xác minh mở cổng");
                System.out.println("2. Thoát");
                System.out.print("Chọn: ");
                String choice = scanner.nextLine().trim();

                if ("2".equals(choice)) {
                    System.out.println("Đã thoát.");
                    return;
                }
                if (!"1".equals(choice)) {
                    System.out.println("Vui lòng chọn 1 hoặc 2.");
                    continue;
                }

                System.out.print("Nhập PIN: ");
                String pinCode = scanner.nextLine().trim();
                simulator.verifyPin(pinCode);
            }
        }
    }

    private void verifyPin(String pinCode) {
        String requestJson = "{\"pinCode\":\"" + escapeJson(pinCode) + "\"}";
        HttpRequest request = HttpRequest.newBuilder(verifyUri)
                .timeout(Duration.ofSeconds(5))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            BackendResult result = parseResponse(response.body());
            if (response.statusCode() >= 200 && response.statusCode() < 300
                    && result != null && result.success) {
                System.out.println("ACCESS GRANTED: " + result.message);
            } else if (result != null) {
                System.out.println("ACCESS DENIED: " + result.message);
            } else {
                System.out.println("ACCESS DENIED: Backend trả HTTP " + response.statusCode()
                        + " hoặc response không hợp lệ.");
            }
        } catch (java.net.http.HttpTimeoutException exception) {
            System.out.println("ACCESS DENIED: Backend phản hồi quá thời gian.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            System.out.println("ACCESS DENIED: Yêu cầu bị gián đoạn.");
        } catch (IOException exception) {
            System.out.println("ACCESS DENIED: Không kết nối được backend. Hãy kiểm tra backend có đang chạy không.");
        } catch (IllegalArgumentException exception) {
            System.out.println("ACCESS DENIED: Không thể tạo request tới backend.");
        }
    }

    private static BackendResult parseResponse(String responseBody) {
        if (responseBody == null) {
            return null;
        }

        Matcher matcher = MESSAGE_FIRST_RESPONSE.matcher(responseBody);
        if (matcher.matches()) {
            return new BackendResult(Boolean.parseBoolean(matcher.group(2)), unescapeJson(matcher.group(1)));
        }

        matcher = SUCCESS_FIRST_RESPONSE.matcher(responseBody);
        if (matcher.matches()) {
            return new BackendResult(Boolean.parseBoolean(matcher.group(1)), unescapeJson(matcher.group(2)));
        }
        return null;
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static String unescapeJson(String value) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < value.length(); i++) {
            char current = value.charAt(i);
            if (current != '\\' || i + 1 >= value.length()) {
                result.append(current);
                continue;
            }

            char escaped = value.charAt(++i);
            switch (escaped) {
                case '"' -> result.append('"');
                case '\\' -> result.append('\\');
                case '/' -> result.append('/');
                case 'b' -> result.append('\b');
                case 'f' -> result.append('\f');
                case 'n' -> result.append('\n');
                case 'r' -> result.append('\r');
                case 't' -> result.append('\t');
                case 'u' -> {
                    if (i + 4 >= value.length()) {
                        return "Backend trả thông báo không hợp lệ.";
                    }
                    try {
                        result.append((char) Integer.parseInt(value.substring(i + 1, i + 5), 16));
                        i += 4;
                    } catch (NumberFormatException exception) {
                        return "Backend trả thông báo không hợp lệ.";
                    }
                }
                default -> {
                    return "Backend trả thông báo không hợp lệ.";
                }
            }
        }
        return result.toString();
    }

    private static class BackendResult {
        private final boolean success;
        private final String message;

        private BackendResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
    }
}
