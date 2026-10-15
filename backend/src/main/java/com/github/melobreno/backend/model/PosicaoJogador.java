package com.github.melobreno.backend.model;

public enum PosicaoJogador {
    GOL(10, 0, 20, 0, 40, 30),
    ZAG(10, 0, 15, 0, 45, 30),
    LAT(25, 0, 20, 15, 25, 15),
    MEI(10, 15, 35, 25, 5, 10),
    ATA(20, 40, 10, 20, 0, 10);

    private final int[] pesosAtributos;

    PosicaoJogador(int... pesosAtributos) {
        this.pesosAtributos = pesosAtributos;
    }

    public int pesoDoAtributo(int indice) {
        return pesosAtributos[indice];
    }
}
