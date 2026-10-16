package com.github.melobreno.backend.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class BusinessException extends ResponseStatusException {
    public BusinessException(HttpStatus httpStatus, String message) {
        super(httpStatus, message);
    }

    public BusinessException(HttpStatus httpStatus, String message, Throwable cause) {
        super(httpStatus, message, cause);
    }
}
