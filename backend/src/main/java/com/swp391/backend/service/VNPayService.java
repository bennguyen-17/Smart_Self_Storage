package com.swp391.backend.service;

import com.swp391.backend.config.VNPayConfig;
import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.DepositWebhookRequest;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class VNPayService {

    private final VNPayConfig vnPayConfig;
    private final DepositService depositService;

    public VNPayService(VNPayConfig vnPayConfig, DepositService depositService) {
        this.vnPayConfig = vnPayConfig;
        this.depositService = depositService;
    }

    public String createPaymentUrl(HttpServletRequest request, String invoiceNumber, BigDecimal amount, String orderInfo) {
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_TxnRef = invoiceNumber;
        String vnp_IpAddr = VNPayConfig.getIpAddress(request);
        String vnp_TmnCode = vnPayConfig.vnp_TmnCode;

        long amountInVnd = amount.multiply(new BigDecimal("100")).longValue();

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amountInVnd));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", orderInfo != null && !orderInfo.isEmpty() ? orderInfo : "Thanh toan tien coc " + invoiceNumber);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        // Sanitize orderInfo to avoid special character mismatch with VNPay
        String cleanOrderInfo = (orderInfo != null && !orderInfo.isBlank()) ? orderInfo : ("Thanh toan hoa don " + invoiceNumber);
        // Normalize Vietnamese characters without accents for maximum gateway compatibility
        cleanOrderInfo = java.text.Normalizer.normalize(cleanOrderInfo, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9\\s_-]", " ");
        vnp_Params.put("vnp_OrderInfo", cleanOrderInfo.trim());

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                try {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));

                    query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8.toString()));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));

                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                } catch (UnsupportedEncodingException e) {
                    // Fallback
                }
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnPayConfig.vnp_HashSecret, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        return vnPayConfig.vnp_PayUrl + "?" + queryUrl;
    }

    public ApiResponse processCallback(Map<String, String> queryParams) {
        String vnp_SecureHash = queryParams.get("vnp_SecureHash");
        Map<String, String> fields = new HashMap<>(queryParams);
        fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String calculatedHash = VNPayConfig.hashAllFields(fields, vnPayConfig.vnp_HashSecret);

        if (!calculatedHash.equalsIgnoreCase(vnp_SecureHash)) {
            return new ApiResponse(false, "Chữ ký bảo mật VNPay không hợp lệ (Invalid Checksum)!");
        }

        String responseCode = queryParams.get("vnp_ResponseCode");
        String invoiceNumber = queryParams.get("vnp_TxnRef");
        String vnpayTransactionNo = queryParams.get("vnp_TransactionNo");
        String bankCode = queryParams.get("vnp_BankCode");

        if ("00".equals(responseCode)) {
            DepositWebhookRequest webhookRequest = new DepositWebhookRequest(
                    invoiceNumber,
                    "VNPAY_TXN_" + vnpayTransactionNo,
                    "BANK_TRANSFER",
                    "GATEWAY_" + bankCode + "_" + vnpayTransactionNo
            );
            if (invoiceNumber != null && invoiceNumber.startsWith("EXT-")) {
                return depositService.confirmExtensionPayment(webhookRequest);
            }
            return depositService.confirmDepositPayment(webhookRequest);
        } else {
            return new ApiResponse(false, "Giao dịch thanh toán VNPay không thành công! Mã lỗi: " + responseCode);
        }
    }
}
