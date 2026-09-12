package com.megamart.service;

import com.megamart.dto.CustomerDto;
import com.megamart.model.Customer;
import com.megamart.model.Transaction;
import com.megamart.repository.CustomerRepository;
import com.megamart.repository.TransactionRepository;
import com.megamart.security.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    public Optional<CustomerDto> lookupByPhone(Long tenantId, String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) return Optional.empty();
        String cleanPhone = phoneNumber.replaceAll("\\D", "");
        String suffix = cleanPhone.length() >= 10 ? cleanPhone.substring(cleanPhone.length() - 10) : cleanPhone;

        return customerRepository.findByTenantId(tenantId).stream()
                .filter(c -> c.getPhoneNumber() != null && c.getPhoneNumber().replaceAll("\\D", "").endsWith(suffix))
                .findFirst()
                .map(CustomerDto::new);
    }

    public Customer getOrCreateCustomer(Long tenantId, String phoneNumber, String name) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return customerRepository.save(new Customer(tenantId, "+91 9999999999", name != null ? name : "Walk-in Guest"));
        }
        String cleanPhone = phoneNumber.replaceAll("\\D", "");
        String suffix = cleanPhone.length() >= 10 ? cleanPhone.substring(cleanPhone.length() - 10) : cleanPhone;

        return customerRepository.findByTenantId(tenantId).stream()
                .filter(c -> c.getPhoneNumber() != null && c.getPhoneNumber().replaceAll("\\D", "").endsWith(suffix))
                .findFirst()
                .orElseGet(() -> customerRepository.save(new Customer(tenantId, phoneNumber, name != null ? name : "Valued Customer")));
    }

    public List<CustomerDto> getAllCustomers(Long tenantId) {
        return customerRepository.findByTenantId(tenantId).stream()
                .map(CustomerDto::new)
                .toList();
    }

    public List<Transaction> getCustomerHistory(Long customerId) {
        return transactionRepository.findByCustomerIdOrderByTimestampDesc(customerId);
    }
}
