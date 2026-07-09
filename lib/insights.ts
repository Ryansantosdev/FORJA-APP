// Biblioteca local de insights — zero banco de dados, funciona offline.
// Frases bíblicas: tradução livre (Almeida). Autores clássicos: citações
// conhecidas traduzidas. Goggins / Clóvis: paráfrases inspiradas no estilo.

export type Categoria =
  | "Cristão"
  | "Estoico"
  | "Goggins"
  | "Nietzsche"
  | "Clóvis"
  | "Foco & Alavancagem";

export type Insight = {
  t: string; // texto
  a: string; // autor / fonte
  c: Categoria;
};

export const CATEGORIAS: Categoria[] = [
  "Cristão",
  "Estoico",
  "Goggins",
  "Nietzsche",
  "Clóvis",
  "Foco & Alavancagem",
];

export const INSIGHTS: Insight[] = [
  // ============ CRISTÃO ============
  { t: "Tudo posso naquele que me fortalece.", a: "Filipenses 4:13", c: "Cristão" },
  { t: "O Senhor é o meu pastor; nada me faltará.", a: "Salmos 23:1", c: "Cristão" },
  { t: "Combati o bom combate, acabei a carreira, guardei a fé.", a: "2 Timóteo 4:7", c: "Cristão" },
  { t: "Não to mandei eu? Esforça-te e tem bom ânimo; não temas, nem te espantes.", a: "Josué 1:9", c: "Cristão" },
  { t: "Vai ter com a formiga, ó preguiçoso; olha para os seus caminhos e sê sábio.", a: "Provérbios 6:6", c: "Cristão" },
  { t: "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens.", a: "Colossenses 3:23", c: "Cristão" },
  { t: "Porque a nenhum dos que esperam no Senhor faltará força.", a: "Isaías 40:31 (adaptado)", c: "Cristão" },
  { t: "Quem é fiel no pouco, também é fiel no muito.", a: "Lucas 16:10", c: "Cristão" },
  { t: "A alma do preguiçoso deseja e nada tem, mas a alma dos diligentes engorda.", a: "Provérbios 13:4", c: "Cristão" },
  { t: "Vigiai e orai, para que não entreis em tentação; o espírito está pronto, mas a carne é fraca.", a: "Mateus 26:41", c: "Cristão" },
  { t: "Não sabeis vós que o vosso corpo é o templo do Espírito Santo? Glorificai, pois, a Deus no vosso corpo.", a: "1 Coríntios 6:19-20", c: "Cristão" },
  { t: "Melhor é o que tarda em irar-se do que o poderoso; e o que domina o seu espírito do que o que toma uma cidade.", a: "Provérbios 16:32", c: "Cristão" },
  { t: "Todo atleta em tudo se domina; eles, para alcançar uma coroa corruptível; nós, uma incorruptível.", a: "1 Coríntios 9:25", c: "Cristão" },
  { t: "Esmurro o meu corpo e o reduzo à escravidão, para que, tendo pregado aos outros, eu mesmo não venha a ser desqualificado.", a: "1 Coríntios 9:27", c: "Cristão" },
  { t: "Não nos cansemos de fazer o bem, pois no tempo próprio colheremos, se não desanimarmos.", a: "Gálatas 6:9", c: "Cristão" },
  { t: "O que semeia pouco, pouco também ceifará; e o que semeia em abundância, em abundância também ceifará.", a: "2 Coríntios 9:6", c: "Cristão" },
  { t: "Lança o teu pão sobre as águas, porque depois de muitos dias o acharás.", a: "Eclesiastes 11:1", c: "Cristão" },
  { t: "Tudo tem o seu tempo determinado, e há tempo para todo propósito debaixo do céu.", a: "Eclesiastes 3:1", c: "Cristão" },
  { t: "A mão diligente dominará, mas a negligente será tributária.", a: "Provérbios 12:24", c: "Cristão" },
  { t: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", a: "Provérbios 3:5", c: "Cristão" },
  { t: "Sede fortes e corajosos. Não temais... porque o Senhor, vosso Deus, é quem vai convosco.", a: "Deuteronômio 31:6", c: "Cristão" },
  { t: "Porta-te varonilmente, e esforcemo-nos pelo nosso povo.", a: "2 Samuel 10:12 (adaptado)", c: "Cristão" },
  { t: "Se Deus é por nós, quem será contra nós?", a: "Romanos 8:31", c: "Cristão" },
  { t: "A fé sem obras é morta.", a: "Tiago 2:26", c: "Cristão" },
  { t: "Sê tu uma bênção: a disciplina de hoje é a oferta que você entrega amanhã.", a: "Princípio cristão", c: "Cristão" },
  { t: "Deus não te deu espírito de covardia, mas de poder, de amor e de moderação.", a: "2 Timóteo 1:7", c: "Cristão" },
  { t: "Aquele que não trabalha, também não coma.", a: "2 Tessalonicenses 3:10", c: "Cristão" },
  { t: "O corpo que você negligencia é o mesmo que Deus te confiou para servir. Cuidar dele é mordomia, não vaidade.", a: "Princípio cristão", c: "Cristão" },
  { t: "Orar pedindo disciplina e ignorar o despertador é pedir a colheita sem plantar.", a: "Princípio cristão", c: "Cristão" },
  { t: "A tentação de desistir sempre chega vestida de bom motivo. Vigie.", a: "Princípio cristão", c: "Cristão" },
  { t: "Considerai que a provação da vossa fé produz a perseverança; e a perseverança deve ter a sua obra perfeita.", a: "Tiago 1:3-4", c: "Cristão" },
  { t: "O sofrimento produz perseverança; a perseverança, caráter; e o caráter, esperança.", a: "Romanos 5:3-4", c: "Cristão" },
  { t: "Ninguém que, tendo posto a mão no arado, olha para trás, é apto para o reino.", a: "Lucas 9:62", c: "Cristão" },
  { t: "Entra pela porta estreita. Larga é a porta que leva à perdição, e muitos entram por ela.", a: "Mateus 7:13", c: "Cristão" },
  { t: "Cada dia tem seu próprio mal. Cuida do dever de hoje; o amanhã pertence a Deus.", a: "Mateus 6:34 (adaptado)", c: "Cristão" },
  { t: "Servo bom e fiel: foste fiel no pouco, sobre o muito te colocarei.", a: "Mateus 25:21", c: "Cristão" },
  { t: "O talento enterrado por medo foi o único que gerou condenação. Use o que te foi dado.", a: "Parábola dos talentos (Mateus 25)", c: "Cristão" },
  { t: "Não vos conformeis com este mundo, mas transformai-vos pela renovação da vossa mente.", a: "Romanos 12:2", c: "Cristão" },
  { t: "Corramos com perseverança a carreira que nos está proposta.", a: "Hebreus 12:1", c: "Cristão" },
  { t: "Nenhuma disciplina parece agradável no momento, mas depois produz fruto de justiça e paz.", a: "Hebreus 12:11", c: "Cristão" },

  // ============ ESTOICO ============
  { t: "Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.", a: "Sêneca", c: "Estoico" },
  { t: "Sofremos mais na imaginação do que na realidade.", a: "Sêneca", c: "Estoico" },
  { t: "Enquanto adiamos, a vida passa.", a: "Sêneca", c: "Estoico" },
  { t: "A sorte é o que acontece quando a preparação encontra a oportunidade.", a: "Sêneca", c: "Estoico" },
  { t: "Não há vento favorável para quem não sabe a que porto se dirige.", a: "Sêneca", c: "Estoico" },
  { t: "Apressa-te a viver bem e pensa que cada dia é, por si só, uma vida.", a: "Sêneca", c: "Estoico" },
  { t: "O homem que sofre antes do necessário sofre mais que o necessário.", a: "Sêneca", c: "Estoico" },
  { t: "Nenhum homem foi sábio por acaso.", a: "Sêneca", c: "Estoico" },
  { t: "Exija de si mesmo antes que a vida exija — ela cobra sem aviso e com juros.", a: "Inspirado em Sêneca", c: "Estoico" },
  { t: "Não é que tenhamos pouco tempo, é que desperdiçamos muito.", a: "Sêneca", c: "Estoico" },
  { t: "Você tem poder sobre sua mente, não sobre os eventos externos. Perceba isso e encontrará força.", a: "Marco Aurélio", c: "Estoico" },
  { t: "O impedimento à ação impulsiona a ação. O que está no caminho torna-se o caminho.", a: "Marco Aurélio", c: "Estoico" },
  { t: "Ao amanhecer, quando tiver preguiça de levantar, pense: estou me erguendo para o trabalho de um ser humano.", a: "Marco Aurélio", c: "Estoico" },
  { t: "Não perca mais tempo discutindo o que um bom homem deveria ser. Seja um.", a: "Marco Aurélio", c: "Estoico" },
  { t: "A melhor vingança é não ser como seu inimigo.", a: "Marco Aurélio", c: "Estoico" },
  { t: "Muito pouco é necessário para uma vida feliz; está tudo dentro de você, na sua forma de pensar.", a: "Marco Aurélio", c: "Estoico" },
  { t: "Faça cada ato da sua vida como se fosse o último.", a: "Marco Aurélio", c: "Estoico" },
  { t: "Aquilo que não é bom para a colmeia não é bom para a abelha.", a: "Marco Aurélio", c: "Estoico" },
  { t: "Olhe para dentro. Dentro está a fonte do bem, e ela sempre pode brotar, se você sempre cavar.", a: "Marco Aurélio", c: "Estoico" },
  { t: "A alma se tinge da cor dos seus pensamentos.", a: "Marco Aurélio", c: "Estoico" },
  { t: "Se não é certo, não faça; se não é verdade, não diga.", a: "Marco Aurélio", c: "Estoico" },
  { t: "Pare de teorizar sobre como deve ser um homem bom. Não há mais tempo. Seja um agora.", a: "Marco Aurélio", c: "Estoico" },
  { t: "Primeiro diga a si mesmo o que você quer ser; depois faça o que precisa ser feito.", a: "Epicteto", c: "Estoico" },
  { t: "Nenhum homem é livre se não é senhor de si mesmo.", a: "Epicteto", c: "Estoico" },
  { t: "Não explique sua filosofia. Incorpore-a.", a: "Epicteto", c: "Estoico" },
  { t: "É impossível começar a aprender aquilo que se pensa que já se sabe.", a: "Epicteto", c: "Estoico" },
  { t: "As circunstâncias não fazem o homem; apenas o revelam a si mesmo.", a: "Epicteto", c: "Estoico" },
  { t: "Quanto tempo mais você vai esperar antes de exigir o melhor de si mesmo?", a: "Epicteto", c: "Estoico" },
  { t: "A riqueza não consiste em ter grandes posses, mas em ter poucas necessidades.", a: "Epicteto", c: "Estoico" },
  { t: "Se queres melhorar, contenta-te em parecer tolo e estúpido no que diz respeito às coisas externas.", a: "Epicteto", c: "Estoico" },
  { t: "Não são as coisas que perturbam os homens, mas as opiniões que eles têm delas.", a: "Epicteto", c: "Estoico" },
  { t: "Toda dificuldade é a chance de praticar a virtude que você diz ter.", a: "Inspirado em Epicteto", c: "Estoico" },
  { t: "Você se torna aquilo a que dá atenção.", a: "Epicteto", c: "Estoico" },
  { t: "O objetivo não é viver muito, é viver certo.", a: "Inspirado em Sêneca", c: "Estoico" },
  { t: "Memento mori: você vai morrer. A pergunta é o que fará com as horas que restam hoje.", a: "Máxima estoica", c: "Estoico" },
  { t: "Amor fati: não deseje que as coisas sejam diferentes. Use-as como são.", a: "Máxima estoica", c: "Estoico" },
  { t: "Premeditatio malorum: ensaie o pior cenário e ele perde o poder de te paralisar.", a: "Máxima estoica", c: "Estoico" },
  { t: "O corpo deve ser tratado com rigor, para que não desobedeça à mente.", a: "Sêneca", c: "Estoico" },
  { t: "Escolha não ser prejudicado — e você não se sentirá prejudicado. Não se sinta prejudicado — e você não terá sido.", a: "Marco Aurélio", c: "Estoico" },
  { t: "A disciplina de hoje é a liberdade de amanhã. O prazer de hoje é a corrente de amanhã.", a: "Máxima estoica", c: "Estoico" },

  // ============ GOGGINS ============
  { t: "Quando você acha que terminou, você só usou 40% do que tem. É aí que o treino começa.", a: "David Goggins — Regra dos 40%", c: "Goggins" },
  { t: "Você não vai encontrar motivação. Você vai criar disciplina. Motivação é humor; disciplina é lei.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "O acordo foi feito com você mesmo. Quebrar o acordo é te ensinar que sua palavra não vale nada.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Ninguém vai te salvar. Ninguém vem. É você contra a sua mente mole das 6 da manhã.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Callous your mind: a mente cria calos como as mãos — apenas fazendo o que dói, repetidamente.", a: "David Goggins", c: "Goggins" },
  { t: "O espelho da prestação de contas: olhe para ele hoje à noite e diga em voz alta o que você não fez.", a: "David Goggins — Accountability Mirror", c: "Goggins" },
  { t: "Conforto é uma droga. Quanto mais você usa, mais precisa, e menos você aguenta a vida real.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Eles não sabem de mim. Enquanto dormem, eu estou pagando o preço que eles não querem pagar.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Sofra agora, de propósito, nos seus termos — ou sofra depois, de surpresa, nos termos da vida.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "A dor que você evita hoje cobra juros. A dor que você escolhe hoje paga dividendos.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Você diz que quer. Seu dia diz que não. O calendário não mente; sua boca sim.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Stay hard não é frase de efeito. É o que você repete na 4ª série quando o corpo implora para parar.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Ser motivado é fácil no dia bom. Quem você é no dia ruim é quem você é de verdade.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "O banco de lembranças: colecione dias difíceis vencidos. É deles que você saca força no inferno.", a: "David Goggins — Cookie Jar", c: "Goggins" },
  { t: "Pare de negociar com a preguiça. Ela é um advogado melhor que você.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Não existe clima para treinar. Existe treino. O clima é detalhe.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Você não está cansado. Você está desacostumado. São coisas diferentes.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "A zona de conforto é um cemitério bonito: todo mundo deitado, quietinho, sem crescer.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Se foi fácil, não contou. Anote o que custou caro — só isso muda quem você é.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Seu potencial não liga para seus sentimentos. Ele só responde a trabalho.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Quem você seria se ninguém estivesse olhando? É esse cara que treina hoje.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "A mediocridade é confortável até o dia em que ela apresenta a conta. E ela sempre apresenta.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Fazer uma vez é sorte. Fazer todo dia é identidade.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Você tem uma escolha: dor da disciplina ou dor do arrependimento. Uma pesa gramas, a outra toneladas.", a: "Inspirado em Jim Rohn / Goggins", c: "Goggins" },
  { t: "O único atalho que existe: começar agora em vez de segunda-feira.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Não conte para ninguém o que você vai fazer. Mostre o que você fez.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "A voz que manda parar é a mesma que te manteve medíocre até aqui. Por que obedecer agora?", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Dia perfeito não existe. Existe dia executado.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Você quer resultado de elite com rotina de espectador. A matemática não fecha.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Quando a alma pedir desconto, cobre o preço cheio.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Inspiração termina no primeiro desconforto. Compromisso começa nele.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "O corpo aguenta. Quem desiste primeiro é a história que você conta para si mesmo.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Cada refeição certa é um tijolo. Cada desculpa é uma marreta. Você constrói ou demole todo dia.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Ninguém se torna imparável. As pessoas se tornam imparáveis um dia insuportável por vez.", a: "Inspirado em David Goggins", c: "Goggins" },
  { t: "Sua rotina é seu voto diário sobre quem você vai ser. Hoje você votou em quem?", a: "Inspirado em David Goggins", c: "Goggins" },

  // ============ NIETZSCHE ============
  { t: "Aquele que tem um porquê para viver pode suportar quase qualquer como.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "O que não me mata me fortalece.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "Torna-te quem tu és.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "Quem luta com monstros deve cuidar para não se tornar um monstro. E se você olhar longamente para o abismo, o abismo também olha para você.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "Sem música, a vida seria um erro. Sem disciplina, seria só barulho.", a: "Nietzsche (adaptado)", c: "Nietzsche" },
  { t: "É preciso ter o caos dentro de si para dar à luz uma estrela dançante.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "O homem é algo que deve ser superado. O que você fez hoje para superá-lo?", a: "Friedrich Nietzsche — Assim Falou Zaratustra", c: "Nietzsche" },
  { t: "A fórmula da minha felicidade: um sim, um não, uma linha reta, um objetivo.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "Aquele que não pode obedecer a si mesmo será comandado.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "Você quer facilidade? Então fique onde está. Grandeza mora na encosta íngreme.", a: "Inspirado em Nietzsche", c: "Nietzsche" },
  { t: "Não existem fatos, apenas interpretações. Escolha a interpretação que te faz agir.", a: "Friedrich Nietzsche (adaptado)", c: "Nietzsche" },
  { t: "O indivíduo sempre teve que lutar para não ser esmagado pela tribo. Mas nenhum preço é alto demais pelo privilégio de ser você mesmo.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "Amor fati: que eu não queira nada diferente do que é — nem no passado, nem no futuro. Não apenas suportar o necessário, mas amá-lo.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "O eterno retorno: viva de tal forma que você desejaria reviver este exato dia infinitas vezes.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "Todo hábito torna a nossa mão mais engenhosa e o nosso gênio mais desajeitado — escolha os hábitos que te constroem.", a: "Nietzsche (adaptado)", c: "Nietzsche" },
  { t: "O caminho para tudo que é grande passa pelo silêncio e pela disciplina.", a: "Inspirado em Nietzsche", c: "Nietzsche" },
  { t: "Quem um dia quiser aprender a voar precisa primeiro aprender a ficar de pé, andar, correr e escalar. Não se voa para o voo.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "O rebanho aceita o padrão. O indivíduo cria os próprios valores — e paga por eles com esforço.", a: "Inspirado em Nietzsche", c: "Nietzsche" },
  { t: "Sofrer sem sentido é tortura. Sofrer com propósito é construção. Dê um propósito à sua dor.", a: "Inspirado em Nietzsche", c: "Nietzsche" },
  { t: "A moral do escravo culpa o mundo. A vontade de potência constrói um mundo novo.", a: "Inspirado em Nietzsche", c: "Nietzsche" },
  { t: "Prefiro ser um sátiro a ser um santo — mas jamais um espectador da própria vida.", a: "Inspirado em Nietzsche", c: "Nietzsche" },
  { t: "O que é feito por amor está sempre além do bem e do mal.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "Nenhum vencedor acredita no acaso.", a: "Friedrich Nietzsche", c: "Nietzsche" },
  { t: "O corpo é uma grande razão. Quem despreza o corpo despreza a própria potência.", a: "Nietzsche — Zaratustra (adaptado)", c: "Nietzsche" },
  { t: "Cansaço que chega sem obra feita é sintoma de vida pequena. Cansaço com obra feita é troféu.", a: "Inspirado em Nietzsche", c: "Nietzsche" },
  { t: "Você chama de descanso o que é fuga. O forte descansa depois; o fraco descansa em vez de.", a: "Inspirado em Nietzsche", c: "Nietzsche" },
  { t: "Construir a si mesmo é a única obra que ninguém pode plagiar.", a: "Inspirado em Nietzsche", c: "Nietzsche" },
  { t: "Grande parte do que chamam de virtude é apenas falta de coragem para o vício — e falta de força para a grandeza.", a: "Inspirado em Nietzsche", c: "Nietzsche" },
  { t: "Não se rebele contra a dificuldade: ela é a academia do espírito.", a: "Inspirado em Nietzsche", c: "Nietzsche" },
  { t: "Escale a sua montanha. O ar rarefeito incomoda — é assim que você sabe que subiu.", a: "Inspirado em Nietzsche", c: "Nietzsche" },

  // ============ CLÓVIS ============
  { t: "A vida que vale a pena ser vivida não é a vida confortável — é a vida que faz sentido.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Felicidade não é a ausência de esforço. É o esforço que encontra sentido.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Você não escolhe as cartas que recebe. Escolhe, a cada dia, como joga.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "O presente é o único tempo em que a vida acontece. O resto é memória ou expectativa.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Excelência não é um ato isolado, é a soma dos seus hábitos. Você é o que repete.", a: "Aristóteles (via Clóvis de Barros Filho)", c: "Clóvis" },
  { t: "Cada escolha é uma renúncia. Quem não renuncia a nada, não escolheu nada.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "O tempo é o único capital que se gasta mesmo quando não se investe.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "A potência que não vira ato morre potência. Talento engavetado é desperdício ontológico.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Ninguém se torna virtuoso por acidente. Virtude é treino, repetição, suor da alma.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Viver bem não é viver muito. É estar inteiro naquilo que se faz.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "A rotina pode ser prisão ou liturgia. Depende de quem oficia.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "O corpo é a sua primeira casa. Quem não cuida da casa, mora mal em qualquer lugar.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Autonomia é dar a si mesmo a própria lei — e ter a hombridade de cumpri-la.", a: "Inspirado em Clóvis de Barros Filho (Kant)", c: "Clóvis" },
  { t: "Quem vive para a opinião alheia terceiriza a própria existência.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "A vida não pergunta se você está pronto. Ela acontece. Prontidão se constrói no jogo.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "O sentido da vida não se encontra; se constrói — tijolo a tijolo, dia a dia.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Há quem passe a vida ensaiando. O palco é hoje, e a plateia já está sentada.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Disciplina é o amor em forma de agenda: você cumpre o que prometeu a quem você ama — inclusive a si.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "A vida boa é a vida examinada e executada. Refletir sem agir é filosofia de sofá.", a: "Inspirado em Clóvis de Barros Filho (Sócrates)", c: "Clóvis" },
  { t: "Você não é o que sente. Você é o que faz com o que sente.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "O fracasso mais comum não é errar: é nunca ter se lançado.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Cada dia é uma aula que não se repete. Falta e recuperação não existem no calendário da vida.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Quem não sabe o que quer da vida obedece a quem sabe.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Prazer imediato é bom. Sentido duradouro é melhor. A sabedoria está em saber a hora de cada um.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "A morte é a deadline definitiva. Ela não aceita pedido de extensão de prazo.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Grandeza é fazer bem feito o que precisa ser feito — mesmo sem plateia, mesmo sem aplauso.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Sua biografia está sendo escrita agora, por você, em tempo real. Releia o capítulo de hoje antes de dormir.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Quem cuida do corpo sem cuidar da mente constrói um templo vazio. Quem cuida da mente sem o corpo, uma biblioteca em ruínas.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "Não existe vida sem atrito. Existe atrito que desgasta e atrito que lapida. A diferença é o propósito.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },
  { t: "A pergunta não é 'quanto tempo eu tenho', é 'o que estou fazendo com o tempo que tenho'.", a: "Inspirado em Clóvis de Barros Filho", c: "Clóvis" },

  // ============ FOCO & ALAVANCAGEM (Choques de Realidade) ============
  { t: "Todo projeto paralelo que você começa é um empréstimo tomado contra o projeto principal — com juros compostos de tempo que você nunca recupera.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Você não está 'explorando oportunidades'. Você está fugindo da única tarefa que te assusta porque é a única que importa.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "O funcionário aperta o botão e recebe pelo aperto. O estrategista constrói a máquina de botões e recebe enquanto dorme — hoje você foi qual dos dois?", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "R$ 8.000/mês é o preço que pagam pelo seu tempo. Enquanto você vender horas, o teto é a sua agenda.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "A teoria perfeita de amanhã vale zero. O rascunho publicado hoje já está gerando dados, audiência e dinheiro.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Perfeccionismo não é padrão alto. É medo de ser julgado, vestido com gravata de 'qualidade'.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Você tem CS + Tech + audiência e ainda pede permissão para cobrar. O mercado não espera você se sentir pronto.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Cada dia sem monetizar sua habilidade rara é um dia em que alguém pior que você fatura no seu lugar.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Morpheus não pediu desculpas por oferecer a pílula. Autoridade se constrói afirmando, não se justificando.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Dispersão é confortável porque quem começa tudo e não termina nada nunca é julgado por um resultado — porque ele não existe.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Você quer escala, mas gasta as noites em tarefas que morrem sem você. Sistema é o que funciona quando você sai da sala.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Melhorar em público por 90 dias constrói mais autoridade do que 2 anos planejando o conteúdo perfeito no rascunho.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Se a sua estratégia depende de motivação, você não tem estratégia. Tem humor.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "O algoritmo não recompensa quem sabe mais. Recompensa quem aparece todo dia — você sabe demais e aparece de menos.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Fechar a aba inútil custa 1 segundo. Mantê-la aberta custa a versão de você que já teria escalado.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Ninguém vai te promover a dono. Dono você se torna construindo o ativo que ninguém mandou você construir.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "O impostor de verdade é quem finge que 'um dia' vai começar. Quem executa mal hoje é mais real do que quem planeja bem há meses.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "IA e automação são alavancas. Alavanca sem ponto de apoio — foco — só move o ar.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Todo 'sim' para uma distração é um 'não' assinado contra a sua liberdade financeira. Você tem assinado muitos.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Aos 23 você tem o ativo que os ricos tentam comprar de volta: tempo. Queimá-lo em dispersão é vender barato a alavanca mais cara do mundo.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Síndrome do impostor com habilidade real é só falta de repetição. Publique 100 vezes e ela morre de fome.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Seu concorrente não é mais talentoso. Ele só não abre 14 abas antes de trabalhar.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Conteúdo não publicado é ativo com liquidez zero. Você está rico em rascunhos e pobre em resultados.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "A audiência não segue quem sabe tudo. Segue quem mostra o caminho enquanto anda.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Escala não é trabalhar mais. É o mesmo trabalho servindo mil pessoas em vez de uma. O que você fez hoje que escala?", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Enquanto você 'estuda mais um curso', alguém com metade do seu conhecimento está cobrando pelo dobro. Conhecimento não monetizado é hobby.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Deep work de 2 horas vale mais que 10 horas de trabalho picado por notificações. Você trabalhou hoje ou só ficou ocupado?", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "O CLT paga suas contas. O que você constrói das 19h às 22h paga sua liberdade.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Sistemas cobram configuração uma vez. Sua força de vontade cobra todos os dias. Automatize a decisão, execute a ação.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Um ano tem 365 dias. Você já queimou quantos esperando se sentir preparado?", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "A dispersão nunca chega dizendo 'vou destruir seu futuro'. Chega dizendo 'só 5 minutinhos'.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Ideia sem execução vale zero. Execução sem consistência vale quase zero. Consistência sem foco constrói a coisa errada.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Quem tenta ser autoridade em tudo vira referência em nada. Escolha a colina e morra defendendo ela.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "Sua atenção é o único recurso que os outros lucram quando você desperdiça. Cada scroll é salário pago para outra pessoa.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
  { t: "O medo de parecer iniciante te mantém iniciante. Quem publica ruim e corrige, aprende em público e cobra por isso depois.", a: "Choque de Realidade", c: "Foco & Alavancagem" },
];

// ---------- Sorteio sem repetição recente ----------

const HISTORY_KEY = "forja_insight_history";
const HISTORY_SIZE = 30;

function getHistory(): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function pushHistory(idx: number) {
  const h = [idx, ...getHistory()].slice(0, HISTORY_SIZE);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

export function drawInsight(categoria?: Categoria): Insight {
  const pool = INSIGHTS.map((ins, idx) => ({ ins, idx })).filter(
    ({ ins }) => !categoria || ins.c === categoria
  );
  const history = getHistory();
  const fresh = pool.filter(({ idx }) => !history.includes(idx));
  const source = fresh.length > 0 ? fresh : pool;
  const pick = source[Math.floor(Math.random() * source.length)];
  pushHistory(pick.idx);
  return pick.ins;
}

/** Frase ao abrir o app — sorteia uma nova a cada visita à tela. */
export function insightOnAppOpen(): Insight {
  return drawInsight();
}

/** Frase do dia — determinística pela data (mesma frase o dia todo). */
export function insightOfTheDay(dateStr: string): Insight {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return INSIGHTS[hash % INSIGHTS.length];
}

export type DayContext = {
  hour: number;
  treinoDone: boolean;
  treinoPendente: boolean;
  streak: number;
  diaIncompleto: boolean;
};

/** Insight contextual conforme o estado do dia */
export function contextualInsight(ctx: DayContext): Insight {
  let pool: Categoria;
  if (ctx.hour >= 18 && ctx.treinoPendente && !ctx.treinoDone) pool = "Goggins";
  else if (ctx.streak >= 7) pool = "Foco & Alavancagem";
  else if (ctx.diaIncompleto && ctx.hour >= 21) pool = "Goggins";
  else if (ctx.streak >= 30) pool = "Nietzsche";
  else pool = "Estoico";
  return drawInsight(pool);
}
