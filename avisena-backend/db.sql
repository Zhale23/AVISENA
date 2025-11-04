CREATE TABLE `sensores` (
	`id_sensor` SMALLINT NOT NULL AUTO_INCREMENT UNIQUE,
	`nombre` VARCHAR(30) NOT NULL,
	`tipo_sensor` VARCHAR(30) NOT NULL,
	`id_galpon` SMALLINT NOT NULL,
	`descripcion` VARCHAR(140) NOT NULL,
	PRIMARY KEY(`id_sensor`)
);


CREATE TABLE `detalle_factura` (
	`id_detalle` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`id_producto` INT NOT NULL,
	`cantidad` INT NOT NULL,
	`id_venta` INT NOT NULL,
	`valor_descuento` FLOAT NOT NULL DEFAULT 0,
	`precio_venta` FLOAT NOT NULL,
	PRIMARY KEY(`id_detalle`)
);


CREATE TABLE `roles` (
	`id_rol` SMALLINT NOT NULL AUTO_INCREMENT UNIQUE,
	`nombre_rol` VARCHAR(30) NOT NULL,
	`descripcion` TEXT(500) NOT NULL,
	PRIMARY KEY(`id_rol`)
);


CREATE TABLE `usuarios` (
	`id_usuario` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`nombre` VARCHAR(70) NOT NULL,
	`id_rol` SMALLINT NOT NULL,
	`email` VARCHAR(100) NOT NULL UNIQUE,
	`telefono` CHAR(15) NOT NULL,
	`documento` VARCHAR(20) NOT NULL,
	`pass_hash` VARCHAR(140) NOT NULL,
	PRIMARY KEY(`id_usuario`)
);


CREATE TABLE `fincas` (
	`id_finca` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`nombre` VARCHAR(30) NOT NULL,
	`longitud` FLOAT NOT NULL,
	`latitud` FLOAT NOT NULL,
	`id_usuario` INT NOT NULL,
	`estado` BOOLEAN NOT NULL,
	PRIMARY KEY(`id_finca`)
);


CREATE TABLE `galpones` (
	`id_galpon` SMALLINT NOT NULL AUTO_INCREMENT UNIQUE,
	`id_finca` INT,
	`id_sensor` SMALLINT,
	PRIMARY KEY(`id_galpon`)
);


CREATE TABLE `lotes` (
	`id_lote` SMALLINT NOT NULL AUTO_INCREMENT UNIQUE,
	`capacidad` INT NOT NULL,
	`tipo_lote` VARCHAR(30) NOT NULL,
	`id_tipo_gallina` SMALLINT NOT NULL,
	`semanas` SMALLINT NOT NULL,
	`id_galpon` SMALLINT NOT NULL,
	`cantidad_gallinas` INT NOT NULL,
	PRIMARY KEY(`id_lote`)
);


CREATE TABLE `inventario` (
	`id_inv` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`nombre` VARCHAR(30) NOT NULL,
	`cantidad` INT NOT NULL,
	`u_medida` ENUM() NOT NULL,
	`descripcion` TEXT(255) NOT NULL,
	`id_categoria` SMALLINT NOT NULL,
	`id_finca` INT NOT NULL,
	PRIMARY KEY(`id_inv`)
);


CREATE TABLE `categoria_inventario` (
	`id_categoria` SMALLINT NOT NULL AUTO_INCREMENT UNIQUE,
	`nombre` VARCHAR(30) NOT NULL,
	`descripcion` TEXT(255) NOT NULL,
	PRIMARY KEY(`id_categoria`)
);


CREATE TABLE `produccion` (
	`id_produccion` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`nombre` VARCHAR(30) NOT NULL,
	`cantidad` INT NOT NULL,
	`id_lote` SMALLINT NOT NULL,
	`fecha` DATE NOT NULL,
	PRIMARY KEY(`id_produccion`)
);


CREATE TABLE `stock` (
	`id_stock` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`u_medida` ENUM("unidad", "panal", "docena", "medio_panal", "kilos") NOT NULL,
	`id_produccion` INT NOT NULL,
	`cantidad_disponible` INT NOT NULL,
	`precio_actual` FLOAT NOT NULL,
	`clasificacion` ENUM("A", "AA", "AAA", "SUPER") NOT NULL,
	PRIMARY KEY(`id_stock`)
);


CREATE TABLE `registro_sensores` (
	`id_reg_sen` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`id_sensor` SMALLINT NOT NULL,
	`dato_sensor` FLOAT NOT NULL,
	`fecha_hora` DATETIME NOT NULL,
	`u_medida` ENUM() NOT NULL,
	PRIMARY KEY(`id_reg_sen`)
);


CREATE TABLE `tareas` (
	`id_tarea` SMALLINT NOT NULL AUTO_INCREMENT UNIQUE,
	`id_usuario` INT NOT NULL,
	`descripcion` VARCHAR(255) NOT NULL,
	`fecha_hora_init` DATETIME NOT NULL,
	`estado` ENUM() NOT NULL,
	`fecha_hora_fin` DATETIME NOT NULL,
	PRIMARY KEY(`id_tarea`)
);


CREATE TABLE `gallinas_tipo` (
	`id_tipo_gallina` SMALLINT NOT NULL AUTO_INCREMENT UNIQUE,
	`raza` VARCHAR(30),
	`descripcion` TEXT(500),
	PRIMARY KEY(`id_tipo_gallina`)
);


CREATE TABLE `ventas` (
	`id_venta` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`fecha_hora` DATETIME NOT NULL,
	`id_usuario` INT NOT NULL,
	`tipo_pago` INT NOT NULL,
	`total` DECIMAL NOT NULL,
	PRIMARY KEY(`id_venta`)
);


CREATE TABLE `tipo_pago` (
	`id_tipo_pago` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`nombre` VARCHAR(15) NOT NULL,
	`descripcion` TEXT(500) NOT NULL,
	PRIMARY KEY(`id_tipo_pago`)
);


CREATE TABLE `incidentes_generales` (
	`id_incidente` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`descripcion` TEXT(500) NOT NULL,
	`fecha_hora` DATETIME NOT NULL,
	`id_finca` INT NOT NULL,
	`esta_resuelto` BOOLEAN NOT NULL,
	PRIMARY KEY(`id_incidente`)
);


CREATE TABLE `incidentes_gallina` (
	`id_inc_gallina` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`lote_gallina` SMALLINT NOT NULL,
	`tipo_incidente` ENUM("muerte", "enfermedad", "fin_postura", "perdida", "otro") NOT NULL,
	`cantidad` SMALLINT NOT NULL,
	`descripcion` TEXT(255) NOT NULL,
	`fecha_hora` DATETIME NOT NULL,
	`esta_resuelto` BOOLEAN NOT NULL,
	PRIMARY KEY(`id_inc_gallina`)
);


CREATE TABLE `aislamiento` (
	`id_aislamiento` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`id_incidente_gallina` INT NOT NULL,
	`id_lote_destino` SMALLINT NOT NULL,
	`fecha_hora` DATETIME NOT NULL,
	PRIMARY KEY(`id_aislamiento`)
);


CREATE TABLE `modulos` (
	`id_modulo` SMALLINT NOT NULL AUTO_INCREMENT UNIQUE,
	`nombre_modulo` VARCHAR(30) NOT NULL,
	PRIMARY KEY(`id_modulo`)
);

DROP TABLE permisos;
CREATE TABLE permisos (
	id_modulo SMALLINT NOT NULL,
	id_rol SMALLINT NOT NULL,
	insertar BOOLEAN NOT NULL,
	actualizar BOOLEAN NOT NULL,
	seleccionar BOOLEAN NOT NULL,
	borrar BOOLEAN NOT NULL,
	PRIMARY KEY(id_modulo, id_rol),
    FOREIGN KEY(id_rol) REFERENCES roles(id_rol),
    FOREIGN KEY(id_modulo) REFERENCES modulos(id_modulo)
);


ALTER TABLE `roles`
ADD FOREIGN KEY(`id_rol`) REFERENCES `usuarios`(`id_rol`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `usuarios`
ADD FOREIGN KEY(`id_usuario`) REFERENCES `fincas`(`id_usuario`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `usuarios`
ADD FOREIGN KEY(`id_usuario`) REFERENCES `tareas`(`id_usuario`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `usuarios`
ADD FOREIGN KEY(`id_usuario`) REFERENCES `ventas`(`id_usuario`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `fincas`
ADD FOREIGN KEY(`id_finca`) REFERENCES `galpones`(`id_finca`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `galpones`
ADD FOREIGN KEY(`id_galpon`) REFERENCES `lotes`(`id_galpon`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `lotes`
ADD FOREIGN KEY(`id_lote`) REFERENCES `produccion`(`id_lote`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `categoria_inventario`
ADD FOREIGN KEY(`id_categoria`) REFERENCES `inventario`(`id_categoria`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `gallinas_tipo`
ADD FOREIGN KEY(`id_tipo_gallina`) REFERENCES `lotes`(`id_tipo_gallina`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `produccion`
ADD FOREIGN KEY(`id_produccion`) REFERENCES `stock`(`id_produccion`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `sensores`
ADD FOREIGN KEY(`id_sensor`) REFERENCES `registro_sensores`(`id_sensor`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `ventas`
ADD FOREIGN KEY(`id_venta`) REFERENCES `detalle_factura`(`id_venta`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `detalle_factura`
ADD FOREIGN KEY(`id_producto`) REFERENCES `stock`(`id_stock`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `tipo_pago`
ADD FOREIGN KEY(`id_tipo_pago`) REFERENCES `ventas`(`tipo_pago`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `incidentes_gallina`
ADD FOREIGN KEY(`id_inc_gallina`) REFERENCES `aislamiento`(`id_incidente_gallina`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `inventario`
ADD FOREIGN KEY(`id_finca`) REFERENCES `fincas`(`id_finca`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `incidentes_gallina`
ADD FOREIGN KEY(`lote_gallina`) REFERENCES `lotes`(`id_lote`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `aislamiento`
ADD FOREIGN KEY(`id_lote_destino`) REFERENCES `lotes`(`id_lote`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `incidentes_generales`
ADD FOREIGN KEY(`id_finca`) REFERENCES `fincas`(`id_finca`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `modulos`
ADD FOREIGN KEY(`id_modulo`) REFERENCES `permisos`(`id_modulo`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `roles`
ADD FOREIGN KEY(`id_rol`) REFERENCES `permisos`(`id_rol`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `galpones`
ADD FOREIGN KEY(`id_galpon`) REFERENCES `sensores`(`id_galpon`)
ON UPDATE NO ACTION ON DELETE NO ACTION;