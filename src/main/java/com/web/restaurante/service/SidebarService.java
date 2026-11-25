package com.web.restaurante.service;

import com.web.restaurante.dto.sidebar.GrupoOpcionDTO;
import com.web.restaurante.dto.sidebar.OpcionDTO;
import com.web.restaurante.dto.sidebar.SidebarDTO;
import com.web.restaurante.exception.RecursoNoEncontradoException;
import com.web.restaurante.mapper.OpcionMapper;
import com.web.restaurante.model.GrupoOpcion;
import com.web.restaurante.model.Opcion;
import com.web.restaurante.model.Perfil;
import com.web.restaurante.repository.PerfilRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SidebarService {
    private final PerfilRepository perfilRepository;
    private final OpcionMapper opcionMapper;

    @Transactional(readOnly = true)
    public SidebarDTO generarSidebar(String nombrePerfil) {
        Perfil perfil = perfilRepository.findByNombreIgnoreCase(nombrePerfil)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe perfil con ese nombre"));

        Set<Opcion> opciones = perfil.getOpciones();

        Map<Boolean, List<Opcion>> mapaOpciones = opciones.stream()
                .collect(Collectors.partitioningBy(
                   o -> o.getGrupoOpcion() != null
                ));

        Map<GrupoOpcion, List<Opcion>> grupoOpcionesMap = mapaOpciones.get(true).stream()
                .collect(Collectors.groupingBy(Opcion::getGrupoOpcion));

        List<GrupoOpcionDTO> grupoOpciones = grupoOpcionesMap.entrySet().stream()
                .map(e -> {
                    GrupoOpcion grupoOpcion = e.getKey();
                    return new GrupoOpcionDTO(
                            grupoOpcion.getNombre(),
                            grupoOpcion.getIcono(),
                            grupoOpcion.getOrden(),
                            grupoOpcion.getCodigo(),
                            opcionMapper.listToDTO(e.getValue())
                    );
                }).toList();

        List<OpcionDTO> opcionesIndividuales = opcionMapper.listToDTO(mapaOpciones.get(false));

        return new SidebarDTO(grupoOpciones, opcionesIndividuales);
    }
}
