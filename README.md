# Antigravity Core — Framework Orquestador Agéntico Bifásico

Este repositorio es una **Plantilla Maestra / Framework Orquestador de IA** 100% agéntico, declarativo y libre de código compilado tradicional. La máquina de estados, el flujo de desarrollo y las operaciones profesionales de GitFlow son ejecutados directamente por la Inteligencia Artificial de la IDE, reaccionando a la creación y modificación de archivos en el espacio de trabajo del usuario.

---

## ⚡ Instalación y Configuración en un Proyecto Cliente

Dado que el framework no tiene dependencias de ejecución locales (como Node.js, CLI scripts o `package.json`), integrarlo en cualquier proyecto cliente es extremadamente sencillo:

1. **Instalar el framework de Antigravity:** Abre una terminal en la raíz de tu proyecto cliente y ejecuta el comando correspondiente para instalar el framework directamente en la carpeta `.agents/` de manera limpia (evitando carpetas duplicadas/anidadas):

   **En Bash / Git Bash / Zsh (Linux/macOS):**
   ```bash
   git clone https://github.com/kevinviscafe/antigravity-core.git temp_antigravity && mv temp_antigravity/.agents .agents && rm -rf temp_antigravity
   ```

   **En PowerShell (Windows):**
   ```powershell
   git clone https://github.com/kevinviscafe/antigravity-core.git temp_antigravity; Move-Item temp_antigravity/.agents .agents; Remove-Item -Recurse -Force temp_antigravity
   ```

   **Mediante un Agente de IA (Prompt):**
   Si prefieres que el agente de tu IDE realice la instalación, cópiale este prompt:
   > "Clona `https://github.com/kevinviscafe/antigravity-core.git` en una carpeta temporal y mueve su carpeta interna `.agents/` directamente a la raíz de mi proyecto. Asegúrate de que la ruta final sea `.agents/agent/` y no esté duplicada (evita `.agents/.agents/`). Borra la carpeta temporal al terminar."

2. **Iniciar:** Abre el proyecto cliente en la IDE de IA habilitada con soporte de agentes (como Cursor o VS Code con plugins compatibles). Las reglas se cargarán de manera automática.

---

## 🔌 Configuración de Servidores MCP (Requisito Obligatorio)

Para que los agentes puedan realizar el diseño automatizado y la investigación profunda, debes tener configurados los siguientes dos servidores MCP en tu IDE:

### 1. Stitch MCP (Diseño de Interfaces)
* **Instalación:** Búscalo e instálalo directamente desde la biblioteca oficial de MCPs de tu IDE (Manage MCP Servers).
* **Configuración:** Solo requiere ingresar tu token de API de Stitch.

### 2. NotebookLM MCP (Investigación y Reportes)
Para instalar y conectar NotebookLM automáticamente a tu IDE vía MCP, cópiale este prompt a tu agente:
> "Conecta NotebookLM vía MCP a mi IDE. Pasos: 1) Instala `notebooklm-mcp-server` usando `uv` (o `pip`). 2) Localiza y edita la configuración MCP activa en mi IDE para registrar el servidor. 3) Ejecuta `notebooklm-mcp-auth` para abrir la autenticación en navegador y guíame. 4) Verifica listando mis notebooks. Pídeme confirmación antes de cambios sensibles."

---

## 🔄 El Ciclo de Vida del Software: Dos Fases Activas

El framework opera en dos fases de desarrollo distintas según el archivo de estado `.antigravity/state.json` (`workflowMode`):

### 🏁 Fase A: Modo MVP (Ciclo Inicial Completo)
1. **Inicialización:** Crea un archivo `lock.md` en la raíz de tu proyecto:
   ```markdown
   Nombre del Proyecto: Mi App
   Descripción General del Proyecto:
   - Visión, propuesta de valor y propósito de la aplicación.
   Descripción de Funcionalidades para el MVP:
   - Funcionalidad X
   - Funcionalidad Y
   Stack Tecnológico: React + Tailwind
   ```
2. **Generación del Reporte:** El agente de IA creará el archivo `.antigravity/state.json`, `.antigravity/approvals.md` y redactará el informe en `deliverables/executive_report.md`.
3. **Compuertas Human-in-the-Loop (HITL):** El flujo se pausará solicitando tu aprobación en el archivo `.antigravity/approvals.md`. Abre el archivo en tu editor, marca con una `x` la compuerta correspondiente y guarda:
   - `- [x] **checkpoint_1**: Aprobar Informe Técnico...`
4. **Diseño y Git Inicial:** El agente Stitch generará los mockups. Al extraerlos en `deliverables/design.md` y `deliverables/assets/`, **el orquestador inicializará Git localmente, creará las ramas `main` y `develop`, checkout a `feature/crm-mvp` y hará push inmediato al repositorio de GitHub**.
5. **Codificación:** El desarrollador programará en `/src` haciendo commits y pushes incrementales automáticos.
6. **Entrega del MVP:** Al marcar `checkpoint_3` en approvals.md, el orquestador fusionará la feature a `develop`, creará la rama de release, mergeará a `main`, la etiquetará con el tag `v1.0.0-beta`, hará push de todo a origen y cambiará el modo de trabajo a `CONTINUOUS`.

---

### 🚀 Fase B: Modo Continuo (Evolución, Características y Bugs)
Una vez entregado el MVP, el orquestador pasa a desarrollo continuo (ignora `lock.md`):

1. **Nuevo Requerimiento:** Crea un archivo `feature.md` (o `feature-nombre.md`) para nuevas funcionalidades, o `bug.md` (o `bug-nombre.md`) para reportar un error.
2. **Propuesta Técnica:** El agente genera un análisis técnico rápido en `.antigravity/temp_spec.md` con los archivos a modificar. Aprueba cambiando la casilla en `.antigravity/approvals.md`:
   - `[x] **approve_spec**: Aprobar análisis técnico...`
3. **Inicio de Rama de Trabajo:** El agente crea de inmediato una rama efímera local (`feature/*` o `bugfix/*`) a partir de `develop` y **hace push a origen**.
4. **Desarrollo y Testeo:** El programador modifica el código en `/src` con commits/pushes granulares y ejecuta las compilaciones/tests locales del proyecto. Al finalizar con éxito, solicita aprobación:
   - `[x] **approve_code**: Aprobar cambios de código y autorizar integración...`
5. **Integración:** El agente realiza el merge local a `develop`, sube `develop` a GitHub y deja lista la integración para Pull Request.

---

## 📁 Estructura del Framework

*   `.agents/`: Configuración y lógica de los agentes de IA.
    *   `agent/`: Personas Markdown (`orchestrator.md`, `conception-agent.md`, `stitch-designer.md`, `mvp-builder.md`).
    *   `skills/`: Directrices detalladas para la ejecución de herramientas MCP (Stitch, NotebookLM) y desarrollo limpio.
    *   `rules/`: Reglas globales (`GEMINI.md`).
