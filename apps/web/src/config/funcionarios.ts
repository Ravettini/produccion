/**
 * Lista de funcionarios importantes. Para el campo Funcionario(s) en evento.
 * Formato: valor y etiqueta = "Nombre Apellido".
 */

const RAW = `Jorge	Macri
Yana	Kashytsya
EMILIA	PUENTE GOMEZ
Victoria	Gorleri
Sebastian Martin	Gayo
Micaela	Saban Orsini
Alberto Maximiliano	Gomez
Edmundo Alberto Durval	Segovia
Nicolas Roberto	Echarri
Maria Julia	Moyano
María Eugenia	Bereciartua
Fernando Martin	Ocampo
Lautaro	Vasser
Nicolás	Doti
Martin David	Haissiner
Lucas Lisandro	Tarucelli
DOUGLAS HECTOR	LYALL
Daniel Agustín	Presti
Marilina	Borneo
Sergio Ruben	Brodsky
Micaela Soledad	Del gaudio
Maria Cristina	Cuello
Ruben Argentino	Luna
Diego Paulo	Isabella
Ricardo Domingo	Ruggiero
Mónica Beatriz	Freda
Emilse Moira	Teyo
Sara Beatriz	Nicolini
Juan Carlos	Valero
Jorge Rodrigo	Martinez Daveño
Carlos Pablo	Maza
Antonio Aimar	Fratamico
Cesar Angel	Torres
Elida	Fernandez
Maximiliano	Costantinis
Virginia Laura	Fredes
Florencia	Gomez
Luciano Nicolás	Martínez
Guillermo	Romero
Lucila María	Lopez Marti
Jorge	Sturzenegger
Paz	Nuñez
Victoria	Pittari
Amira	Labora
Ramiro	Fernandez
Patricio	Vallone
Luis Daniel	Malaspina
Kevin	Lopez
Fanny	Peña
Federico	Martin Veiga
Juan Pablo	jorge costa
María Belén	Perrella
Micaela	Der
Sofia	Benegas
Federico	Ambrosetti
Juan Manuel	Badaloni
Juan	Speroni Hernandez
sofia	de la llera
Camila Isabel	Fernández
Victoria	Tonnelier
Gustavo	Gago
Federico	Elias
Eduardo Alberto	Cura
Baltazar	Jaramillo
Máximo	Merchensky
Ayelen	Doglioli
Alida Tatiana	Latella
Vanina	Caruso
Lara	Manguel
HERNAN	Coego
Julieta Valeria	Vegas Rodriguez
Mariana	Szteinmarder
Emiliano Cruz	Michelena
Israel	Aguilar Parrilla
Lorena Patricia	Schejtman
Facundo	Suárez
Carolina Silvina	Bartel
FIAMMA	FERNANDEZ
Daniel	Fernández
Sebastian Ezequiel	Alonso
Jose Maria	Grippo
Maria Florencia	Parietti
Hector Mario	Mesquida
Francisco	Lartirigoyen
Mariana Matilde	Dávalos
Indalecio Ricardo	Lopez Diaz
Ignacio Joaquin	Moro
Mariana Florencia	Kamian
Maximiliano	Hérnandez
María Luján	Domenech
Tamara	Laznik
Santiago	Alberdi
Rosario	Burone Risso
Candelaría Ines	Prieto Buselli
Ezequiel	Sabor
Sergio	Scappini
Emmanuel Holofernes	López Badra
Roberto Alfredo	Quattromano
María Julia	De Bariazarra
Francisco	García
Facundo	Bargalló Benegas
Maria Florencia	Saavedra
Pablo Ezequiel	Feito
Matias	Debesa
Sergio Gustavo	Monzón
Sofía	Costa
María de los Angeles	Maratea
Guadalupe	Rossi
Mariano	Steininger
Martín Andres	Maffuchi
Mariana	Ferreyra
Mauro	Morando
Ignacio	Salaberri
Maximiliano	Corach
Hernan Pablo	Saladdino Vilar
Carlos Lionel	Traboulsi
Gustavo Ezequiel	Gonzalez
Juan	Santos
Fede	Bouzas
Tomas	Cueto Gonzalez
Julio Cesar Leonardo	Delgado
Sabina	Penna Tanuri
Mariela Solange	Noya
Bruno Alfredo	Caputo
Monica	Buchuk
Claudio	Baranzelli
Fulvio	Pompeo
Norberto	Pontiroli
Irene	Wlodkowski
Cecilia Rumi	Gonzalez
Nerio	Pace
Mariano	Lomolino
María del Pilar	Bosca Chillida
Clara	Porres
Federico	Diaz Abal
Ana Valeria	Ciuti
Magdalena	Ponce
Matias Nahuel	Muñoz
Mercedes	Luquin
Clara	Muzzio
Tomás	Galmarini
Juan Pablo	Biset
María Verónica	Corro
Federico	Sabbatini
JOSUE EMILIANO	PETKOVSEK
Nicolas	Merchensky
Malena	Raffa
Gaspar	Lloret Kersman
Sofia	Cognigni
Natalia	Persini
Mauro	Monte
Ezequiel	Welsk
Carolina	Theler
Camila	Cavallero Bottero
Ignacio Martin	Suarez Martin
Sofia	Castillo
Analia	Flores
Marina	Garat
Renzo	Morosi
Nadia Denise	Porcel
Carolina Laura	De Sande
Ana	Chanfreau
Marianela Aldana	Navasal
Boris Nicolas	Buffa
Melina Soledad	Bloise
Josefina María	Pena Podrez
Lourdes	Mouriño
Ramiro Pablo	Reyno Grondona
Mercedes	Barbara
Agustina	Ciarletta
Julian	Vilche
Pia	Tobias
macarena	Mazzeo
Estefanía	Willis Andreau
Stefano	Salmeri
Victor Daniel	Gonzalez Lopez
Candela	Díaz mazzeo
Josefina	Gonzalez Astarloa
Paz	Rosales Soria
Natalia	Paterno
María Celeste	Chain
Sofía Angela	Torroba
Anto	Ermilio
Lucila	de Elizalde
Tiago	Giansily
Agostina Paula	Freddi
Sebastian Agustín	Tsuji
Sebastian	Ratero
Noelia Aldana	Franco
Cecilia	Gomez padilla
Micaela	Bonavia
Ana María	Bou Pérez
Karina	Guerschberg
María	Angione
Pablo	Morolla
Carlos	Dangelo
Verónica Giselle	Russo
Mercedes	Rozental
Gabriel	Sanchez Zinny
Adriana Isabel	Storni
Maria Celeste	Mc Garry
Cristina Aurora	Giraud
Antonella Ana	Amicucci
Marcelo Roberto	Di Mario
Florencia	Suárez
Noelia Soledad	Ceñal
Emiliano	De Martino
GABRIEL ALEJANDRO	KELEMEN
Marta Beatriz	Ferrarotti
Hernán Pablo	Cullari
Maria Sol	Cocuzza
Federico Luis	Braga
Virginia	Tazzioli
Mercedes Constanza	Ottavino
Fabián Alejandro	Turnes
Gustavo	Inganni
Juan Martín	Costa
Hernán Pablo	Poggi
Jorge Mariano	Rusconi
Matias Raul	Segura
Marcelo Tristán	Bosch
Joaquin	Orlando
Pilar	Poblete
Tomas Francisco	Burtin
Juan Pablo	Sassano
Raul	Piola
Nadia	Marinzalda
Pablo Andres	Saccani
Nadina Graciela	Mezza
Santiago	Sabarots
Jorge Ariel	Gonzalez
Gabriela	ANGELETTI
Ana	Chorroarin
Antonella	Zalazar
Gustavo	Linares
Daniela María	Calero
Federico	Tuffano
Pedro Ignacio	Alessandri
Milagros Jazmín	González
Juan Pablo	Migliavacca
Julieta	Rappan
Melany Ángeles	Segarra Marinetti
María Florencia	Costello
Macarena	Blasi
Félix	Doura
Jorge	Miguez
María Eugenia	Djubelian
Mariana	Tonina
Camila	Galdo
María Florencia	Nestasio
Sofía Victoria	Trillo
Daniela Alejandra	García
Abril	Canitrot
Natalia Isabel	Corrales Ruiz
Magalí	Castelo
Renata	Flosi
Agustina	Verguizas
José María	Donati
María Eugenia	Lago
Juan Carlos	PEREZ COLMAN
Hernan	Lombardi
PATRICIA	PECORA
Andres Angel	Perrone
Sabrina Nicole	Slauscius
Martina	Magaldi
Juan Manuel	Blardone Perosa
Emilio Carlos	Laferriere
Elena	Carmelich
Patricia Valentina	Fagundez
Alejandro Félix	Capato
Francisco	Baratta
Mario	Fuentes
Geraldine	Gueron
Yamil	Santoro
Augusto	Ardiles Díaz
GONZALO	GALARRAGA
Fernando Rodolfo	Villa
Mayra	Wilson
Nicolás	Belsito
Nicolas	Russo
Rocio Elizabeth	Galarza Del Viso
Mayra	Aquino
Nahuel	Celerier
Pablo	Cosentino
Gaston Augusto	Gonzalez
santiago	peso
Federico Ezequiel	Pinho
German	Smart
Ana Laura	Lloberas
Guillermina	Arrechea
Vicente Mario	Espósito
Valentín	Díaz Gilligan
Michelle	Taiah
Martin Andres	Galante
Lila Araceli	Bacigalupo
María Eugenia	Wehbe
Lucia	Aranda
Damian Alberto	Buonocore
Mercedes	Miguel
Lorena	Aguirregomezcorta
Mauricio	Giambartolomei
Miguel Angel	Garófalo
Maria Alejandra	Gurgo
Natalia	Anzulovic
Nora Ruth	Lima
Federico	Garofalo
Gustavo Fabián	Alvarez
Pablo	Villarreal
Laura	Baloglu
Samanta	Bonelli
Jonathan	Modernel
Ines	Cruzalegui
Ignacio	Balcaneras
Teresa	Patronelli
Sol	Renzi
Nancy	Sorfo
Graciela	Uequin
Luis Ignacio	Rigal
Ignacio José	Curti
VICTORIA	PAVIOTTI
Ariel Alberto	Juarez
Tatiana	Vazquez
Sofia	Zava
Nicolás	García Fernandez Saenz
Julio	Alvarez
Carlos Augusto	Rosales Cartier
Julieta	Almeyra
Oscar	Ghillione
Juan	Mc Loughlin
Rocio Itati	Gomez Mosca
Julieta	Villarmea
Viviana Edith	Dalla Zorza
Soledad	Rodriguez
Yesica	Mustafa
Ignacio Manuel	Sanguinetti
Antonela	Caccianini
Mariano Alfredo	Perez Alfaro
Tamara	Cergneux
Tomás	Foricher
María Florencia	Ripani
Horacio Alberto	Gimenez
Verónica	González
Sonia Patricia	Cuellar
Mariana	Vello
Antonella	Giollo
Luis Pablo	Policicchio
Carla	Mangiameli
Ignacio Adrian	Sisro
Estefanía Michelle	Pener
Maximiliano	Gallucci
Georgina	Ricciardi
Javier Martin	López Zavaleta
Juan Manuel	Castrilli
Mathías E.	Valdez Duffau
Mauro	Cochello
Leandro Jorge	Manzano
Raúl	López Presa
Natalia Gabriela	Calviño
Mariana	Urtasun
Emmanuel Maximiliano	Gil
Andrés Nicolás	Monsalvo
Claudio Alberto	Panichelli
Hernán Jorge	Cerezo
Daniel Fernando	Barbuto
Jacqueline Ana	Forschner
Emiliano	Arias
Diego Sebastián	Taranto
Gastón Leopoldo	Navarro
Andrés Fernando	Sisti
Maximiliano Hernán	Piñeiro
Felipe Ignacio	Cascante
Nestor A	Nicolas
Rodrigo Fabián	Duna
Walter Daniel	Gómez Diz
Carlos Alberto	Álvarez
Alberto Ángel	Carita
Juan Carlos	Moriconi
Roberto Angel	Parente
Alejandro	Puglia
Andrea	Triolo
Carlos A.	Lage
Claudio Walter	Abbondanza
Ruth Elisa	Landerreche Alonso
Ezequiel Carlos	Zotta Varela
Georgina	Marinucci
Cintia Anabel	Kosaka Santa Cruz
Mariana	Di Palma
Giuliana	Spizzo
Carlos María	Brun
Tomas	Lodeiro
Ignacio Antonio	Cocca
Leandro Nicolás	Meis
Vicente Marcelo	Zeolla
Leandro Joel	Iribas
florencia	matayoshi
Christia	Vallecca
Diego Ariel	Casalo
Ignacio	Baistrocchi
Teresita	Vidal
Javier	Mayorca
Nuria Cecilia	Gómez Videla
Agostina	Napoli
Diego Maximiliano	Cuesta
María Eugenia	Torossian
Antonella	Pagano
facundo	Calvi
Pedro Martín	Comin Villanueva
Yoana Soledad	Fiore
Pablo	Pulita
Alejandra Elizabeth	Perez Nella
Marcela Claudia	Angioi
Belen	Antonuccio
Ramiro Jesus	Peralta
Gabriel	Gauna
Federico	Garcia Resta
Victoria	Bleynat
Agustin	Barcos
Mariano	Carmona
Yoel Jesus	Bedaglia
Agustina	Ramos Mejia
Juan Ignacio	Salari
Agustina Belén	Pérez
Karina Patricia	Soto
Daniela	Quaglia Pratesi
Gaston	Celerier
Joel	Iacarini
Magdalena	Aybar Perlender
Julieta	Lezcano
Gimena Natalia	De Franco
María Mercedes	Ferrari
Rosario Maria	Guerrero
Juan Pablo	Delpino
Marcela	Gianturco
Sofía	Dasso
Juan Pablo	Vacas
Anastasia	Weisbek
María Cecilia	Segal
Lorena	Dopazo
Josefina	Bruno
MICAELA CAROLINA	SORIA GUERRERO
Sebastian Marcelo	Galindo
Romina	Marson
Gabino	Tapia
Lucía María	Ferrari
Max	Perkins
Ricardo Christian	Pardo
Victoria	Watson
Leonardo Jorge	Sarquis
Ezequiel	Jarvis
Alejandro	Ameijenda
Adrián Hugo	González
Julieta Mora	Miragaya
Matías	Lanusse
Bruno	Leoni Olivera
Sabrina	Wolf
Franco	Cammarata
Agustin	Montagnoli
Carla	Borgognoni
Juan Martin	Malcolm
Jose Manuel	Ramos
Laura Virginia	Costancio
Maria Belen	Taccone
Manuela María	Cantarelli
Natalia	Gambaro
Maria Paula	Pichon Riviere
Javier Washington	Bica Ríos
Pablo Fabián	D'Alessandro
Santiago	Solda
Karina Ángela	Palacios
Javier Ignacio	Tejerizo
Andrés	González Grobas
Francisco Javier	Quintana
Javier	Vazquez
Gustavo Alejandro	May
Romina	Murisasco
Leandro Ernesto	Halperin
Hernán Emilio	Najenson
Karen	Lozzia
Agustín	Ulanovsky
Bárbara	Mattei
Mariano Alberto	Salvatori
Jorge Daniel	Mansilla
Adrian Patricio	Grassi
Milagros	Martinez Bourimborde
Janine	WEIDEMANN
Natasha	Steinberg
Mariana	Calcagno
Monica	Vaccarezza
Felicitas	De Lasa
Agostina	Sanguedolce Villafañe
Horacio Esteban	Bueno
JORGE	BENVENUTO
Monica Paola	Tijeras
Adrián Alfonso	Jalife
Fernando	Cohen
Alicia	Vazquez
Carlos Fabricio	Diaz
Rodrigo	Bouzas
Marcelo Claudio	Bouzas
Fernan	Quiros
Margarita	Cejas
Silvia Susana	Platas
Carolina	Fitzpatrick
GABRIELA	SALSE
Maria Florencia	Flax Marcó
Gabriela Viviana	Perrotta
Maria Victoria	Rodriguez Quintana
Nicolas	Pose
Cecilia María	Klappenbach
Lucas	Del Hoyo Azcueta
Emilse Carmen	Filippo
Mercedes María	Di Loreto
Paul	Vasco
María Belén	Carjuzáa
Gonzalo Daniel	Ponce
Felix	Calvino
Federico Luis	Azpiri
Gonzalo	La Cava
Nicolas	Buero
Jorge	Angelelli
Marcelo Dario	Fakih
Eugenia Lucia	Palmucci
Facundo	Sandovares
Paola Soledad	Huck
Ariel Mario	Goldman
Hugo Nicolás	Morato
Sergio Ricardo	Auger
Alberto Felix	Crescenti
Horacio Pedro	Rodríguez O'Connor
Laura	Cordero
Patricio	Basile
Carlos Fernando	Cichero
Jorge José	Vergés
Martin Rodrigo	Ortiz Pacual
Gabriel	Battistella
Verónica	Palacio Tejedor
Mariana Laura	Arribas
Diego Jorge	Vacchino
Florencia Ayelen	Quiroga
Walter	Cuevas
Daniel Carlos	Ferrante
Leandro Noer	Alassia
adriana fabiana	villaverde
Laura Silvina	Waynsztok
Andrea	Andreacchio
María Eugenia	Botteri Domecq
Lisandro	Areco
Mariana	Rofrano
Francisco José	Recondo
Gustavo	Arengo Piragine
Javier	Salas Bulacio
Nereida	Delgado
Horacio	Luppi
Gustavo Damian	Szuchter
Juan Carlos	Rojas
Germán	Krivocapich
Manuel	Balestretti
Demian	Tujsnaider
Nancy Viviana	Charlin
Juan Ignacio	Nigrelli
Silvina	Lima
Maria Guadalupe	Morera
Gustavo	Barroso
Daniela Carolina	Cistola
Luciano	Almada
Guillermo	Laje
Carmen	Polledo
Jesús Mariano	Acevedo
Martin	Garcia Santillan
Victoria María eva	Del rio Frontera
EZEQUIEL	DOMINGUEZ
Agustina	Pando
MAXIMILIANO	LETTO
Luis	Dettler
Sebastián	Vivot
Lucas	Lo Bianco
Ana Maria	Perez Ibarra
Guillermo Manuel	Sanchez Sterli
FEDERICO	BERNARDI
Rosendo Luis	Tarsetti
Mariano	Aenlle
Alejo	Bustamante
alan	matthesius
Agustín	Gonzalez Calderon
Eloy Manuel	Aguirre Rebora
Josefina	Alvarez
Marcelo	Busellini
Sebastian	Fernández
Mariana	ledesma
Barbara Viviana	Ramirez Navarro
Rafael	Ohrnialian
Natalia	Roji
Leandro Ezequiel	Bianchi
María Belén	Flores
Marisa Andrea	Tojo
Ángeles	Ferreyra
Juan Francisco	Rico
José Antonio	Villamil
Lorena	Flores
Horacio Salvador	Stavale
Lucia Griselda	Gabelli
Antonella Carla	Mitidieri
Sandra Noelia	Cascales
Gisela Veronica	Furiati
Ramón José	Gauto
Gabriela	Ricardes
Alejandra	Cuevas
Leonardo Martín	Bellante
agustin	de leo
Carolina Paola	Cordero
Guillermo Andrés	Brea
María Victoria	Alcaraz
Maria Eugenia	Santar
Blas fabian	Sanchez
Alberto Atilio	Ligaluppi
GONZALO	BAO
Javier Solano	Martinez
Valeria Mirta	Gracía
Pedro Ramon	Aparicio
Victoria Eugenia	Noorthoorn
Lía Elena	Rueda
Cristian Leopoldo	Ludovisi
Marcela	La Salvia
Andrés	Rodriguez
Diego	Capuya
Gerardo	Grieco
Gustavo	Mozzi
Analia	Alberico
Alejandro Damian	Gomez
Ana Lorena	Riafrecha
María Isabel	Gual
Victor Hugo Ramon	Gervini
Marcelo Raul	Birman
Thelma	Vivoni
Julio	Boca
Jazmín Anahí	martinez
Jorge Maximiliano	Tomas
Sergio	Egner
Debora Viviana	Rajtman
María Fernanda	Rotondaro
Julieta	Garcia Lenzi
Gabriela Andrea	Beltré
Juan Manuel	Beati Vindel
Alejndro Gabriel	Casavalle
Luciano	Majolo
Robert Vincet	Cortina
Gabriel	Mraida
Patricio	Scarzella
Juan Pablo	Gutierrez Diaz
Maria Laura	Peredo
Hebe	Martinez
Ramón	Busto
Marianela	Zigaran Pereson
Julieta	Meroño
Agostina	Russo
Pamela Abril	Sanchez
María Julia	Córdoba
guillermo federico	barberis
Maria Pia	Inchauspe
Jerónimo	Alvarez Morales
Maria Paz	Popovich
Fernando Emilio	Contreras
Leandro	Selim Saaied
Justina	Suarez Anzorena
Vanessa	Bonito
Mauricio Ramón Jesús	Giraudo
Tamara	Mejuto
Marcelo	Costantino
Guadalupe	Gutierrez Ortiz
Rodolfo Facundo	Ramirez
Rocio Belen	Martinez
María de los Ángeles	Fava
LUISINA	JAIMES
Matias	Kornetz
Cintia	Lucero
Carla	Del Valle Artunduaga González
ANA LUZ	VALLEJOS
Angeles María	Mc Loughlin
Iñaki	Cañete alberdi
Laura Antonela	Rodríguez Franchi
Gabriela	Peisina
Alejandra	Bochi
María Fernanda	Reyes
María Eugenia	Martocq
Nicolas	Caldarola
Florencia	Cadorini
Gabriel Maximiliano	Sahonero
dario omar	duarte
Santiago	Lopez Medrano
Matias	Pantanali
Nicolas	Bari
Emilio	Raposo varela
martin	fiorito
Paula	Pérez Marquina
Matias	Zappino
Eduardo	Bevacqua
Carlos Angel	Gslins
Juan Maria	Furnari
Leonardo Lucas	Coppola
Damián	Sala
Laura	Ortuño
Pia	Guardamagna
María Cecilia	Sobrero
Roxana	FOLGUEIRAS
Hugo	Savarino
Alejandro	Perez Grillo
Mariana	Lods
Sergio Gabriel	Costantino
Ale	Correa
Lucas	Castrogiovanni
Myrian	Bernardelli
Maria Soledad	Benedetto
Veronica	Gonzalez
Andres	Bonavia
Micaela Belén	Erosa
Miguel Angel	Sola
Jesica	Alberto
Elisa	ROcca
Daniela Noelí	Giao
alejandro	miletti
jimena	lambri
Pablo Gabriel	Rodriguez
Julieta	Barambones
Eugenia	Hourquebie
Pedro	Brichta
Priscila	Bauer
Martin	Medina
María de las Mercedes	Joury
Angelez	Cabrera
Luis Ignacio	Cabrera
Sabrina	Musolino
Agustín Rafael	Fernandez Bertuzzi
Ana Belen	Rimoldi
Ezequiel Adrián	Villanueva
Gonzalo Martín	Straface
Pablo	Bereciartua
Hernan	Vela
Fabian	Pettigrew
Fernando Jorge	Codino
ERGASTO	RIVA
Juan Pablo	Fasanella
Javier	Ibañez
Mauro	Alabuenas
Diego Humberto	Enríquez
Claudio	Leonardi
Jorge	KOGAN
Erica	Rubia Peticco
Gabriel Domingo	Zarate
Ricardo	Ferreyra
Facundo	Lombardo
Matias	Montú
Gabriel Eduardo	Rosales
Josefina	Ducos
Facundo	Marzano Gallo
Anibal	Del Olmo
Alejandro	Yomal
Sandra	Tuya
Bianca Andrea	Saporiti
Ricardo Cesar	Fernandez
Lucía	Kaufman
Dario Fabian	Antiñolo
DOLORES	BERNASSAR
Leandro Maximiliano	Ricciardi
Pablo Martin	Magno
Marcelo Ezequiel	Dameno Aguilera
Mateo	Rajuan
Héctor Guillermo	Krantzer
Claudia	Torres
Lisandro Julian	Perotti
Tomas	Daels
Alvaro	Quiroga
Santiago	Bozzo
Juan Pablo	Laiseca
Pablo Daniel	Moretto
Antonio David	Cortes
Maia	Zapotoczny
Martín Andrés	Alvarez del Rivero
Carolina	Fregenal
Eduardo	Dottore
Roberto	Domecq
María	Souto
Natalia	Neri
Sergio	Giordano
Eduardo Carlos	Baini
Lilian Elizabeth Fernanda	PÉREZ
Daniel	Weissbrod
Alfonso	Martinho
Pablo	González Montaner
Dora	Lombardi
Ada Paula	Severino
Patricio	Jolis
Patricia	Alvarez Zunino
Adriana	Serchenko
Gisela Sandra	Aquije Matta Kloster
Gabriela	Scagnet
Eduardo Daniel	Napoli
Hernan	Filippo
CLAUDIO MARIO	ODORICO
Juan	Villani
Jorge Marcelo	Copani
Raul	Barrueco
Pablo	Neira
Fernando Adrián	González
Miguel	Braun
Gustavo	Jankilevich
Miguel Javier	Indart De Arza
Rubén Daniel	Almada
Nestor	Hernande
Lucas Horacio	Portela Lacanette
Agustin	Fox
Federico	Ballan
Maximiliano	Mosquera Fantoni
Florencia	Mattei
Florencia	Scavino
Martin	Cantera
Agustin	Ponti
Sebastian	Perdomo
Nicolas	Mainieri
Silvia	Collin
Silvia	Milarra
Iara	Surt
Juan Manuel	Oro
Lautaro	Eviner
Sergio	Siciliano
Gimena	Villafruela
Patricia Inés	Glize
Laura	Alonso
Ignacio José	Parera
Matías Damián	López
Waldo	Wolff
ROCIO	FIGUEROA
Dario Hugo	Nieto
Fernando	De Andreis
Antonela	Giampieri`;

function parse(): { value: string; label: string }[] {
  const seen = new Set<string>();
  return RAW.split("\n")
    .map((line) => {
      const parts = line.split("\t").map((s) => s.replace(/^"|"$/g, "").trim());
      const full = parts.filter(Boolean).join(" ").trim();
      return full;
    })
    .filter((full) => full.length > 0)
    .filter((full) => {
      if (seen.has(full)) return false;
      seen.add(full);
      return true;
    })
    .map((full) => ({ value: full, label: full }));
}

export const FUNCIONARIOS_OPTIONS = parse();
