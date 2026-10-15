package com.github.melobreno.backend.model;

public enum CondicaoJogador {
    APTO(0),
    MAL_CONDICIONADO(150),
    DOENTE(300);

    private final int descontoMercado;

    CondicaoJogador(int descontoMercado) {
        this.descontoMercado = descontoMercado;
    }

    public int descontoMercadoEmDecimos() {
        return descontoMercado;
    }
}
