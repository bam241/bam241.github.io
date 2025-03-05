---
layout: project
title: "OpenMC Extraction"
description: "I developed a custom modification for NAAREA to enhance the OpenMC Monte Carlo nuclear simulation code, specifically tailored for their XSMR (Advanced Small Modular Reactor) design studies. This enhancement introduces the capability to simulate the continuous extraction and transfer of arbitrary nuclides between specified materials during a simulation, enabling more accurate modeling of isotopic evolution, depletion, and fuel cycle analysis. The core of the modification involved designing and implementing a new Transfer class within the OpenMC framework, conceptually similar to OpenMC's existing Chain class for decay chains. This new class incorporates a Bateman equation solver augmented with a custom transfer matrix to precisely handle the flow of nuclides between source and target materials, accounting for user-defined extraction efficiencies and residence times. The solution was implemented in Python 3 and integrated into NAAREA's Git version control system. A comprehensive suite of deliverables was provided, including the fully tested and documented source code, a detailed user manual explaining the algorithm, input parameters (using an XML-based format), and software dependencies. Furthermore, a set of four integral test cases was developed to validate the functionality and ensure accurate results, accompanied by automated test scripts for continuous integration. This custom modification provides NAAREA with a powerful and flexible tool to analyze complex depletion scenarios, optimize fuel management strategies, and ultimately enhance the design and performance of their XSMR."
short_description: "I developed a custom modification to the OpenMC nuclear simulation code for NAAREA, enabling the continuous extraction and transfer of arbitrary nuclides between materials during simulations. This feature allows for precise tracking of isotopic evolution, supporting advanced reactor design studies like NAAREA's XSMR project. The delivered solution includes a fully tested and documented codebase, integrated within NAAREA's existing workflow, along with comprehensive test cases and supporting documentation."
start_date: 2023-01-15
end_date: 2023-02-31
client: "NAAREA"
recommendation_text: "Baptiste has been working for our company since 2 years now as an external consultant on scientific computations. He was very helpful to carry out some early complicated developments and to help mentoring our junior engineers. The commercial relationship was very straightforward and quality was always there. I would recommend Baptiste in any case you need someone well-versed into neutronics calculations and clean code !"
recommendation_author: "Dr T. Kooyman"
skills:
  - Python
  - OpenMC
  - Bateman
  - Git
---