package com.web.restaurante.dto.productoprecio;

<<<<<<< HEAD
public record ActualizacionPrecioDTO(
        Long idProducto,
        Double nuevoPrecio
) {
}
=======
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
>>>>>>> b3e9bad3807125454ee5751a1dc7cb85750c5ba0
