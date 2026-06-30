-- =============================================================================
-- TECSUR Intranet Académica — Script de Registro Masivo de Alumnos
-- Transcripción automatizada a partir de lista provista en imagen
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================================================

-- SECCIÓN 1 (Púrpura en la Imagen)
-- Carrera sugerida: 'Mantenimiento de Maquinaria Pesada'
INSERT INTO public.alumnos (dni, codigo, nombres, apellidos, carrera) VALUES
('70501622', '70501622', 'Edilson Nicasio', 'CALISAYA PONCE', 'Mantenimiento de Maquinaria Pesada'),
('61955944', '61955944', 'Jhon Roy', 'CHAMBI APAZA', 'Mantenimiento de Maquinaria Pesada'),
('43330396', '43330396', 'Tito Wagner', 'CHAMI PILCO', 'Mantenimiento de Maquinaria Pesada'),
('48674567', '48674567', 'Junior Franz', 'CHIATA APAZA', 'Mantenimiento de Maquinaria Pesada'),
('44349380', '44349380', 'Milton Neil', 'CHUATA PONGO', 'Mantenimiento de Maquinaria Pesada'),
('74581297', '74581297', 'Olger Ernesto', 'COILA DEL PINO', 'Mantenimiento de Maquinaria Pesada'),
('71758507', '71758507', 'Jhon Alindon', 'CONDORI RAMOS', 'Mantenimiento de Maquinaria Pesada'),
('76169080', '76169080', 'William Jhon', 'CONDORI ZAPANA', 'Mantenimiento de Maquinaria Pesada'),
('70135882', '70135882', 'Tito', 'CUBA TIYO', 'Mantenimiento de Maquinaria Pesada'),
('76793879', '76793879', 'Jhon Augusto', 'ENRIQUEZ MAMANI', 'Mantenimiento de Maquinaria Pesada'),
('71203022', '71203022', 'Erick Deny', 'GARCIA ROCA', 'Mantenimiento de Maquinaria Pesada'),
('61505307', '61505307', 'Jorge Elianep', 'HUAQUISTO TITO', 'Mantenimiento de Maquinaria Pesada'),
('45417865', '45417865', 'Milser Ronald', 'HUALLA MAQUERA', 'Mantenimiento de Maquinaria Pesada'),
('74552251', '74552251', 'Miguel Nicasio', 'LUPACA PINO', 'Mantenimiento de Maquinaria Pesada'),
('42358872', '42358872', 'Roger Efraín', 'MACHACA PARI', 'Mantenimiento de Maquinaria Pesada'),
('60925204', '60925204', 'Heli Josías', 'MERMA YUCRA', 'Mantenimiento de Maquinaria Pesada'),
('73934333', '73934333', 'Jimmy Yomer', 'PARI CALSINA', 'Mantenimiento de Maquinaria Pesada'),
('48507311', '48507311', 'Roly Roy', 'PINTO MAMANI', 'Mantenimiento de Maquinaria Pesada'),
('72265080', '72265080', 'Maribel Floria', 'QUISPE AQUINO', 'Mantenimiento de Maquinaria Pesada'),
('70295193', '70295193', 'Jhoel Ivan', 'QUISPE HANCCO', 'Mantenimiento de Maquinaria Pesada'),
('47355083', '47355083', 'Reymer Genaro', 'QUISPE QUISPE', 'Mantenimiento de Maquinaria Pesada'),
('70835921', '70835921', 'Alvaro Hugo', 'SANCHO TURPO', 'Mantenimiento de Maquinaria Pesada'),
('73111428', '73111428', 'Miguel Orlando', 'SULLCA YUCA', 'Mantenimiento de Maquinaria Pesada'),
('47447910', '47447910', 'Yhery Edison', 'CHAMACA LAMES', 'Mantenimiento de Maquinaria Pesada')
ON CONFLICT (dni) DO NOTHING;

-- SECCIÓN 2 (Amarillo en la Imagen)
-- Carrera sugerida: 'Operación de Cargador Frontal'
INSERT INTO public.alumnos (dni, codigo, nombres, apellidos, carrera) VALUES
('46179350', '46179350', 'Milton Abel', 'CANQUE HUAYTA', 'Operación de Cargador Frontal'),
('48497720', '48497720', 'Daniel Nelson', 'CASTILLO CCACCA', 'Operación de Cargador Frontal'),
('74116035', '74116035', 'Raul Ruben', 'CATILIERA TINOCO', 'Operación de Cargador Frontal'),
('46524312', '46524312', 'Roly Abel', 'CONDORI COPACOMA', 'Operación de Cargador Frontal'),
('45434290', '45434290', 'Fernando Pedro', 'HUAMÁN CASAFRANCA', 'Operación de Cargador Frontal'),
('45417311', '45417311', 'Jaime Abel', 'JAHUIRA MAMANI', 'Operación de Cargador Frontal'),
('45293635', '45293635', 'Hernan Jhonny', 'LUPACA MAQUERA', 'Operación de Cargador Frontal'),
('70334884', '70334884', 'Axel Armando', 'MAMANI FILIPCO', 'Operación de Cargador Frontal'),
('43330290', '43330290', 'Tino Bruno', 'MAMANI TORETO', 'Operación de Cargador Frontal'),
('44535311', '44535311', 'Theodore Antonio', 'ORTEGA MAMANI', 'Operación de Cargador Frontal'),
('70611220', '70611220', 'Emerson Aldair', 'PARICAHUA MAMANI', 'Operación de Cargador Frontal'),
('48509311', '48509311', 'Alvaro Jhonny', 'PARI PARI', 'Operación de Cargador Frontal'),
('74217112', '74217112', 'Juan Elison', 'PASCAL PENAS', 'Operación de Cargador Frontal'),
('45774880', '45774880', 'Percy Beltrán', 'RAMOS YANA', 'Operación de Cargador Frontal'),
('43235282', '43235282', 'Edwin Nelson', 'SUCAPUCA COKOMAQUI', 'Operación de Cargador Frontal'),
('46525791', '46525791', 'Joel Henderson', 'YUPANQUI ANCO', 'Operación de Cargador Frontal'),
('45291730', '45291730', 'William Jhonny', 'TITO HUANCA', 'Operación de Cargador Frontal'),
('47738272', '47738272', 'Jhon Nelson', 'UVIÑA CAHUAPAZA', 'Operación de Cargador Frontal'),
('45595745', '45595745', 'Yilton Felix', 'VALERO HUANCA', 'Operación de Cargador Frontal'),
('46505080', '46505080', 'Eddy Bernardo', 'YANA O''HARA', 'Operación de Cargador Frontal')
ON CONFLICT (dni) DO NOTHING;

-- SECCIÓN 3 (Verde en la Imagen)
-- Carrera sugerida: 'Operación de Excavadora'
INSERT INTO public.alumnos (dni, codigo, nombres, apellidos, carrera) VALUES
('74581297', '74581297', 'Nilton', 'BELLIDO TURPO', 'Operación de Excavadora'),
('76169080', '76169080', 'Jhoel Jhon', 'CAHUAPAZA GIDEON', 'Operación de Excavadora'),
('47447910', '47447910', 'Yhery Edison', 'CUSACANI LAURA', 'Operación de Excavadora'),
('61505307', '61505307', 'Jorge Elianep', 'HUAQUISTO TITO', 'Operación de Excavadora'),
('45417865', '45417865', 'Milser Ronald', 'LARICO TAIPINA', 'Operación de Excavadora'),
('70501622', '70501622', 'Nelson Nicasio', 'PANTI ARISAPANA', 'Operación de Excavadora'),
('48674567', '48674567', 'Yomer Franz', 'QUISPE HUALLPA', 'Operación de Excavadora'),
('45774880', '45774880', 'Percy Beltrán', 'RAMOS YANA', 'Operación de Excavadora'),
('71203022', '71203022', 'Abel Sabino', 'VELASQUEZ QUISPE', 'Operación de Excavadora'),
('42358872', '42358872', 'Roger Efraín', 'VILCA APAZA', 'Operación de Excavadora'),
('70611220', '70611220', 'Emerson Aldair', 'QUISPE SULLCA', 'Operación de Excavadora'),
('48509311', '48509311', 'Alvaro Jhonny', 'QUISPE HANCCO', 'Operación de Excavadora'),
('48507311', '48507311', 'Roly Roy', 'SULLCA YUCA', 'Operación de Excavadora'),
('46525791', '46525791', 'Joel Henderson', 'YUPANQUI ANCO', 'Operación de Excavadora')
ON CONFLICT (dni) DO NOTHING;

-- SECCIÓN 4 (Violeta en la Imagen)
-- Carrera sugerida: 'Operación de Motoniveladora'
INSERT INTO public.alumnos (dni, codigo, nombres, apellidos, carrera) VALUES
('70242201', '70242201', 'Henry Ángel', 'APAZA MAMANI', 'Operación de Motoniveladora'),
('45417830', '45417830', 'Wilson Nelson', 'BELLIDO PONCE', 'Operación de Motoniveladora'),
('61955944', '61955944', 'Denis Roy', 'CALSINA CALSINA', 'Operación de Motoniveladora'),
('43330396', '43330396', 'Jhon Wagner', 'CONDORI ZAPANA', 'Operación de Motoniveladora'),
('48507311', '48507311', 'Roly Roy', 'ENRIQUEZ MAMANI', 'Operación de Motoniveladora'),
('74116035', '74116035', 'Raul Ruben', 'CUTIPA TINOCO', 'Operación de Motoniveladora'),
('76793879', '76793879', 'Augusto Carlos', 'HILASACA MAMANI', 'Operación de Motoniveladora'),
('70501622', '70501622', 'Nelson Nicasio', 'PINTO MAMANI', 'Operación de Motoniveladora'),
('70295193', '70295193', 'Jhoel Ivan', 'QUISPE QUISPE', 'Operación de Motoniveladora'),
('45293635', '45293635', 'Jaime Sabino', 'REYNOSO YANA', 'Operación de Motoniveladora'),
('45774880', '45774880', 'Percy Beltrán', 'SULLCA YUCA', 'Operación de Motoniveladora'),
('74581297', '74581297', 'Olger Ernesto', 'YUCRA ARAPA', 'Operación de Motoniveladora'),
('70135882', '70135882', 'Tito', 'CONDORI CONDORI', 'Operación de Motoniveladora'),
('44349380', '44349380', 'Abel Fernando', 'HUALLA HUAQUISTACO', 'Operación de Motoniveladora'),
('74217112', '74217112', 'Daniel Elison', 'LUPACA MAQUERA', 'Operación de Motoniveladora'),
('47355083', '47355083', 'Jhon Genaro', 'CHAQUILLA MAMANI', 'Operación de Motoniveladora')
ON CONFLICT (dni) DO NOTHING;

-- SECCIÓN 5 (Rojo/Rosa en la Imagen)
-- Carrera sugerida: 'Operación de Tractor de Orugas'
INSERT INTO public.alumnos (dni, codigo, nombres, apellidos, carrera) VALUES
('70835921', '70835921', 'Reymer Jhasell', 'CONDORI QUISPE', 'Operación de Tractor de Orugas'),
('48674567', '48674567', 'Cristian Arturo', 'JIMENEZ MILLA', 'Operación de Tractor de Orugas'),
('74116035', '74116035', 'René Ruben', 'LAURA TANGOLA', 'Operación de Tractor de Orugas'),
('72265080', '72265080', 'Carlos Yohel', 'MAMANI YUCRA', 'Operación de Tractor de Orugas'),
('70611220', '70611220', 'Emerson Yulber', 'MAQUERA MAMANI', 'Operación de Tractor de Orugas'),
('42358872', '42358872', 'Alvaro Franz', 'VILCA LUQUE', 'Operación de Tractor de Orugas'),
('45291730', '45291730', 'William Nelson', 'PARI PARI', 'Operación de Tractor de Orugas'),
('45595745', '45595745', 'Yilton Yohel', 'QUISPE TOCASCCA', 'Operación de Tractor de Orugas'),
('70835921', '70835921', 'Alvaro Hugo', 'MEDINA VELASQUEZ', 'Operación de Tractor de Orugas'),
('61955947', '61955947', 'Severo Javier', 'MAMANI CURI', 'Operación de Tractor de Orugas'),
('70334884', '70334884', 'Ronald Jhoel', 'CUSI BEDOYA', 'Operación de Tractor de Orugas'),
('70501622', '70501622', 'Edilson Nicasio', 'VARGAS MAMANI', 'Operación de Tractor de Orugas'),
('76793879', '76793879', 'Teddy Sebastian', 'LUQUE DIAZ', 'Operación de Tractor de Orugas'),
('45417830', '45417830', 'Giancarlo Oscar', 'MENDOZA VILLAFUERTE', 'Operación de Tractor de Orugas')
ON CONFLICT (dni) DO NOTHING;

-- SECCIÓN 6 (Verde/Menta en la Imagen)
-- Carrera sugerida: 'Seguridad Minera'
INSERT INTO public.alumnos (dni, codigo, nombres, apellidos, carrera) VALUES
('76169080', '76169080', 'Jhon', 'CONDORI HUANCA', 'Seguridad Minera'),
('73934333', '73934333', 'Jhoel Yomer', 'ENRIQUEZ HANCCO', 'Seguridad Minera'),
('48507311', '48507311', 'Roly Roy', 'MERMA QUISPE', 'Seguridad Minera'),
('74217112', '74217112', 'Gualberto', 'ORTEGA ORTEGA', 'Seguridad Minera'),
('76793879', '76793879', 'Augusto', 'QUISPE QUISPE', 'Seguridad Minera'),
('48509311', '48509311', 'David', 'MAMANI MENDOZA', 'Seguridad Minera'),
('46505080', '46505080', 'Jaime Orbelín', 'ROJAS CONDORI', 'Seguridad Minera'),
('43235282', '43235282', 'Edwin Nelson', 'UTURUNCO COPA', 'Seguridad Minera'),
('76169080', '76169080', 'Jhoel Fernando', 'LANZA RUELAS', 'Seguridad Minera'),
('76793879', '76793879', 'Augusto Carlos', 'MERMA VALERO', 'Seguridad Minera'),
('48497720', '48497720', 'Daniel Nelson', 'CATACORA PILCO', 'Seguridad Minera'),
('45293635', '45293635', 'Jaime Sabino', 'QUISPE YUCRA', 'Seguridad Minera'),
('70611220', '70611220', 'Emerson Yulber', 'TAPARA PACORI', 'Seguridad Minera'),
('45774880', '45774880', 'Percy Beltrán', 'YUPANQUI APAZA', 'Seguridad Minera'),
('61955944', '61955944', 'Yessica Shanty', 'CHAMBI HANCCO', 'Seguridad Minera'),
('73934333', '73934333', 'Edilson Yomer', 'NINA MAMANI', 'Seguridad Minera')
ON CONFLICT (dni) DO NOTHING;

-- SECCIÓN 7 (Amarillo claro en la Imagen)
-- Carrera sugerida: 'Operación de Cargador Frontal'
INSERT INTO public.alumnos (dni, codigo, nombres, apellidos, carrera) VALUES
('46525791', '46525791', 'Jhon Denys', 'CURRO MAMANI', 'Operación de Cargador Frontal'),
('45417311', '45417311', 'Yury Antony', 'PUMA MAMANI', 'Operación de Cargador Frontal'),
('70295193', '70295193', 'ROLANDO', 'ALANOCA SANDOVAL', 'Operación de Cargador Frontal'),
('43235282', '43235282', 'Edwin Nelson', 'MAMANI CLAVIJO', 'Operación de Cargador Frontal'),
('45595745', '45595745', 'Nilton Felix', 'TURPO CHURATA', 'Operación de Cargador Frontal'),
('45774880', '45774880', 'Percy Beltrán', 'MERMA VILCA', 'Operación de Cargador Frontal'),
('48507311', '48507311', 'Roly Roy', 'CUBA TITO', 'Operación de Cargador Frontal'),
('61955944', '61955944', 'Denis Roy', 'MERMA VALERIANO', 'Operación de Cargador Frontal'),
('76169080', '76169080', 'William Jhon', 'COILA HUANCA', 'Operación de Cargador Frontal'),
('76793879', '76793879', 'Jhon Augusto', 'CONDORI CONDORI', 'Operación de Cargador Frontal')
ON CONFLICT (dni) DO NOTHING;

-- SECCIÓN 8 (Celeste en la Imagen)
-- Carrera sugerida: 'Mantenimiento de Maquinaria Pesada'
INSERT INTO public.alumnos (dni, codigo, nombres, apellidos, carrera) VALUES
('46524312', '46524312', 'Jhon Wily', 'CALSINA MACHACA', 'Mantenimiento de Maquinaria Pesada'),
('47355083', '47355083', 'Angel Genaro', 'HUAMANI APAZA', 'Mantenimiento de Maquinaria Pesada'),
('73111428', '73111428', 'Jhonatan Andrés', 'TITO HUANCA', 'Mantenimiento de Maquinaria Pesada'),
('47447910', '47447910', 'Yhery Edison', 'JAHUIRA JAHUIRA', 'Mantenimiento de Maquinaria Pesada'),
('45774880', '45774880', 'Percy Beltrán', 'QUISPE VILCA HUAQUISTO', 'Mantenimiento de Maquinaria Pesada')
ON CONFLICT (dni) DO NOTHING;
