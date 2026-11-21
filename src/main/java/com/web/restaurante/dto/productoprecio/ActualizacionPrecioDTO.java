
package com.web.restaurante.dto.productoprecio;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ActualizacionPrecioDTO(
        @JsonProperty("idProducto")
        Long idProducto,

        @JsonProperty("nuevoPrecio")
        Double nuevoPrecio
) {
    public ActualizacionPrecioDTO(
            @JsonProperty("id") Long id,
            @JsonProperty("idProducto") Long idProducto,
            @JsonProperty("precio") Double precio,
            @JsonProperty("nuevoPrecio") Double nuevoPrecio
    ) {
        this(
                idProducto != null ? idProducto : id,
                nuevoPrecio != null ? nuevoPrecio : precio
        );
    }
}
