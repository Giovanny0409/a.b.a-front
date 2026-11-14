## ADDED Requirements

### Requirement: Avisos de éxito y de error
La app SHALL avisar el resultado de registrar una compra, un gasto o una venta en una ventana de aviso
(SweetAlert2) con los textos de `es.json`. Un éxito SHALL verse como éxito y cerrarse solo después de unos
segundos. Un error SHALL verse como error, mostrar el mensaje del backend tal cual cuando lo haya, y quedarse
hasta que la persona lo cierre.

#### Scenario: Compra registrada
- **WHEN** se guarda una compra válida
- **THEN** aparece un aviso de éxito «Compra registrada» que se cierra solo, y la línea queda vacía

#### Scenario: Error del backend
- **WHEN** el backend rechaza una compra con un mensaje
- **THEN** aparece un aviso de error con ese mensaje, que se queda hasta que se cierra

#### Scenario: Gasto registrado
- **WHEN** se guarda un gasto válido
- **THEN** aparece un aviso de éxito «Gasto registrado»

### Requirement: Confirmar antes de borrar
Borrar un ticket guardado SHALL pedir confirmación en una ventana de la app, con «Eliminar» y «Cancelar».

#### Scenario: Cancelar el borrado
- **WHEN** se pide eliminar un ticket guardado y se elige «Cancelar»
- **THEN** el ticket sigue en la lista

### Requirement: Aviso de sin conexión
Cuando una petición al backend falle porque el servidor no responde, la app SHALL mostrar una sola vez el
aviso «Sin conexión con el servidor», con «Reintentar», que recarga la pantalla. No SHALL repetir el
aviso por cada petición fallida al mismo tiempo.

#### Scenario: Backend apagado
- **WHEN** se abre el Tablero con el backend apagado
- **THEN** aparece un solo aviso «Sin conexión con el servidor» con «Reintentar», aunque fallen las cinco peticiones del Tablero
