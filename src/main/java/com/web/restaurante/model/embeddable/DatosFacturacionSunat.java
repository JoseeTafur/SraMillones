package com.web.restaurante.model.embeddable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Lob;
import lombok.Getter;
import lombok.Setter;

@Embeddable
@Getter
@Setter
public class DatosFacturacionSunat {

    @Column(name = "comprobante_tipo", length = 20)
    private String comprobanteTipo;

    @Column(name = "comprobante_numero", length = 30)
    private String comprobanteNumero;

    @Column(name = "comprobante_e_numero", length = 30)
    private String comprobanteENumero;

    @Column(name = "comprobante_nota_numero")
    private String comprobanteNotaNumero;

    private String preferenciaComprobante;
    private String comprobantePdfUrl;
    private String comprobanteA4Url;

    @Lob
    @Column(name = "comprobante_xml_contenido", columnDefinition = "LONGTEXT")
    private String comprobanteXmlContenido;

    // --- NOTAS DE CRÉDITO Y ANULACIONES ---
    @Column(name = "credito_nota_numero", length = 30)
    private String creditoNotaNumero;

    @Column(name = "nota_pdf_url")
    private String notaPdfUrl;

    @Column(name = "nota_a4_url")
    private String notaA4Url;

    @Lob
    @Column(name = "nota_xml_contenido", columnDefinition = "LONGTEXT")
    private String notaXmlContenido;
}