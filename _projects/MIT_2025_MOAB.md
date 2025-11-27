---
layout: project
title: "MOAB RTT readeer upgrade"

description: "I upgraded MOAB’s RTT reader to enable reliable RTT-to-DAGMC h5m conversion via pydagmc. I implemented parsing of the dims section to read nside_flag_types and ncell_flag_types and made the reader flexible to handle variable side and cell flags. I added support for boundary-condition side_flags (e.g., vacuum, reflective, transmission) and a cell_flag to assign materials to tetrahedra. I preserved component-name mappings from REGIONS, ABAQUS_PARTS, and MCNP_PSEUDO-CELLS, and used MCNP_PSEUDO-CELLS identifiers as DAGMC volume IDs for easier validation. For discontiguous meshes, I added logic to detect overlaps and prepare data structures that aid particle tracking. I also enabled optional handling of a BOUNDARY_TYPE side_flag on triangles/surfaces and a TEMPERATURE cell_flag on cells. This work is demonstrated on an example RTT mesh and builds on prior exploratory changes."

short_description: "I upgraded MOAB’s RTT reader to enable robust RTT→DAGMC h5m conversion via pydagmc, adding dims parsing, flexible side/cell flag handling (boundary conditions, materials), and support for discontiguous meshes."

start_date: 2025-04-05
end_date: 2025-05-20

client: "MIT"

skills:
    - C++
    - OpenMC
    - Bash
    - CI/CD
categories:
    - Software Architecture
    - Unit testing
    - Development
    - Nuclear Engineering
---