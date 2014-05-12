Fernando
========

Sistema de monitoreo y control energético de viviendas.


Descripción
===========

Este sistema esta diseñado para el monitoreo de temperatura, humedad, iluminación, prescencia y potencia eléctrica, así como para el control de iluminación, clima o calefacción de una vivienda, este software complementa el hardware de un sistema domótico desarrollado bajo la tarjeta de desarrollo Arduino.


Manejo de datos
================

El sistema recibe datos de una estación base utilizando un Raspberry Pi que actua como Gateway, el cual a su vez recibe los datos de los sensores conectados a un Arduino utilizando el protocolo ZigBee.

Los modulos de sensores tienen como identificador la dirección baja de cada Xbee:

Habitación 1 (Sala):	40AD6568
Habitación 2 (Cuarto):	40B13749
Habitación 3 (Cocina):	40B136BC
Energía eléctrica:	40B13727


La manera en la cual son recibidos los datos de los sensores son:

	Modulos Habitaciones
	

a) Estados:111111

De esta manera se representan los estados logicos de los pines del arduino, si se encuentran en estado HIGH o LOW, donde son 6 bits de reconocimiento de estados de izquierda a derecha. 

          estado  estado  sensor  sensor  xbee   xbee 
           Foco	  Clima	   LDR	   PIR	   D0	  D1
Estados:  bit_1   bit_2   bit_3   bit_4   bit_5  bit_6


El primer bit representa si la iluminación se encuentra encendida o apagada indicado por 0 y 1.

El segundo bit representa si la claefacción o clima se encuentra encendida o apagada indicado por 0 y 1.

El tercer bit indica el dato que es enviado por el sensor de iluminación, este dato puede ser 0 y 1 dependiendo si hay suficiente iluminación o poca iluminación.

El cuarto bit indica el dato que es enviado por el sensor de prescencia, este dato puede ser 0 y 1 dependendiendo si se encuentra alguna persona que detecte el sensor.

El quinto bit indica el dato que es enviado por el Xbee desde su pin D0, este dato puede ser 0 y 1 dependiendo del dato que sea enviado por el usuario desde la interfaz web para el control de iluminación.

El sexto bit indica el dato que es enviado por el Xbee desde su pin D1, este dato puede ser 0 y 1 dependiendo del dato que sea enviado por el usuario desde la interfaz web para el control de calefacción o clima.

b) Temperatura:00.00 

Esta representada en grados centigrados.

c) Humedad:00.00

Esta representada en porcentaje.

	Modulo Cocina
	

a) Estados:111111

b) Temperatura:00.00

c) Humedad:00.00

d) LPG:00.00 	

Indica la proporción en partes por millon de Gas LP.

e) CO:00.00  

Indica la proporción en partes por millon de CO, Monoxido de Carbono.

f) HUMO:00.00 

Indica la proporción en partes por millon de humo.

	Modulo Potencia
	

a) CG:00:00

Indica la potencia general en Watts del circuito electrico general de una vivienda, obtenida por los datos capturados por el sensor de corriente y multiplicada por el voltaje general obtenido por el sensor de voltaje.

b) VG:00:00

Indica el voltaje general en Volts del circuito electrico general de una vivienda, obtenido por los datos capturados por el sensor de voltaje.

c) C1:00:00

Indica la potencia en Watts del primer circuito electrico derivado del general de una vivienda, obtenida por los datos capturados por el sensor de corriente y multiplicada por el voltaje general obtenido por el sensor de voltaje.

d) C2:00:00

Indica la potencia en Watts del segundo circuito electrico derivado del general de una vivienda, obtenida por los datos capturados por el sensor de corriente y multiplicada por el voltaje general obtenido por el sensor de voltaje.

e) C3:00:00

Indica la potencia en Watts del tercer circuito electrico derivado del general de una vivienda, obtenida por los datos capturados por el sensor de corriente y multiplicada por el voltaje general obtenido por el sensor de voltaje.


El sistema Fernando recopila y adminstra los datos recibidos para poder visualizarlos de manera legible para el usuario.



Licencia
--------

"Fernando" fue escrito y desarrollado por Óscar Justo y es liberado al público en general bajo la licencia GNU General Public Licence (GPL) v3.

El texto de la licencia se incluye con el código fuente de este software, disponible en: https://github.com/OscarJusto/Fernando
