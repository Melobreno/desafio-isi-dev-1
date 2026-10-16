package com.github.melobreno.backend.exceptions;

import org.springframework.http.HttpStatus;

public class BadRequestException extends BusinessException {
    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(HttpStatus.BAD_REQUEST, message, cause);
    }

    public BadRequestException(String message, HttpStatus httpStatus) {
        super(httpStatus, message);
    }

}
