# KaiOra_DuocUC
Plataforma web y móvil híbrida para la gestión estandarizada de fichas técnicas culinarias en instituciones de educación superior gastronómica en Chile.

---

## Descripción

KaiOra Institute centraliza la distribución de material técnico culinario entre profesores y alumnos, reemplazando la dispersión de contenido informal (TikTok, Instagram, YouTube) con fichas técnicas institucionales estandarizadas que incluyen ingredientes, procedimiento paso a paso, Puntos Críticos de Control (PCC) sanitarios, puntos clave, errores frecuentes y criterios de evaluación.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Ionic 7 + Angular 17 (NgModules) |
| Backend | Firebase (Authentication + Firestore) |
| Hosting | Firebase Hosting |
| Arquitectura móvil | Capacitor (iOS / Android) |
| Importación de datos | SheetJS (xlsx) |
| Estilos | SCSS con sistema de diseño propio |

---

## Roles del sistema

| Rol | Descripción |
|---|---|
| **Admin** | Gestiona profesores, cursos y alumnos. Importación masiva de alumnos por CSV/Excel |
| **Profesor** | Crea y gestiona fichas técnicas. Activa fichas en sus cursos con observaciones personalizadas |
| **Alumno** | Visualiza la ficha activa de su curso y explora la biblioteca de fichas |

---

## Funcionalidades principales

### Administrador
- Crear profesores con cuenta de Firebase Auth automática
- Crear cursos con nómina de alumnos (manual o importación CSV/Excel, máximo 45 alumnos)
- Editar nombre, descripción y alumnos de un curso
- Eliminar curso en cascada (course-recipes, alumnos de Firestore)
- Editar nombre de alumnos

### Profesor
- Crear fichas técnicas con acordeones: información básica, ingredientes, procedimiento, puntos técnicos (PCC, puntos clave, errores frecuentes) y criterios de evaluación
- Activar fichas en uno o más cursos con observaciones opcionales
- Desactivar fichas por curso de forma individual
- Explorar biblioteca de todas las fichas disponibles
- Visualizar cursos asignados y sus alumnos

### Alumno
- Visualizar ficha técnica activa de su curso (desktop: layout por bloques, mobile: acordeones)
- Ver observaciones del profesor si las hay
- Explorar biblioteca de fichas con búsqueda por nombre y filtro por categoría
- Ver detalle completo de cualquier ficha en modal
