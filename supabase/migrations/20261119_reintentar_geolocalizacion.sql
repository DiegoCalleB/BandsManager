-- La primera geolocalización guardó solo el punto de la ciudad (aproximado) para las salas que no consiguió situar, porque leía
-- mal la respuesta del geocodificador (jsonv2 llama `category` a lo que se leía como `class`). Se deja sin fecha de intento a
-- esas salas para que la siguiente pasada vuelva a buscar el local. Idempotente: solo afecta a las que siguen siendo aproximadas.
UPDATE catalogo_salas SET geolocalizada_en = NULL WHERE coordenadas_aprox = TRUE;
