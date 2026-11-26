package com.web.restaurante.mapper;

import com.web.restaurante.dto.auth.MeDTO;
import com.web.restaurante.dto.usuario.TokenUsuarioDTO;
import com.web.restaurante.dto.usuario.UsuarioDTO;
import com.web.restaurante.model.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = PerfilMapper.class)
public interface UsuarioMapper {
    UsuarioDTO toDTO(Usuario usuario);

    @Mapping(target = "perfil", source = "perfil.nombre")
    TokenUsuarioDTO toTokenDTO(Usuario usuario);

    @Mapping(target = "perfil", source = "perfil.nombre")
    MeDTO toMeDTO(Usuario usuario);
}
