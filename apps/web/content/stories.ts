import type { AppLocale } from '@/lang'
import type { LocalizedStory, StoryDefinition, StoryId } from '@/types/stories'

const STORIES: StoryDefinition[] = [
  {
    id: 'boat',
    coverImage: '/images/stories/barco/portada.webp',
    theme: 'sunrise',
    content: {
      es: {
        title: 'El Barco Encantado',
        summary: 'Coco navega por el mar, ayuda a sus nuevos amigos y descubre un tesoro especial.',
        coverAlt: 'Portada del cuento El Barco Encantado',
        pages: [
          {
            title: 'Capítulo 1: El barco sorpresa',
            image: '/images/stories/barco/cap-1.webp',
            imageAlt: 'Coco encuentra un barco en el puerto',
            paragraphs: [
              'Una mañana, Coco encontró una carta junto a su cuenco de comida. "Querido Coco, te invitamos a un viaje en barco. Firmado: Capitán Pez".',
              'Coco ladró de alegría y corrió hasta el puerto. Allí le esperaba un barquito con una bandera que decía: "La aventura empieza aquí".',
            ],
          },
          {
            title: 'Capítulo 2: La ballena que cantaba',
            image: '/images/stories/barco/cap-2.webp',
            imageAlt: 'Coco escucha a una ballena cantar en el mar',
            paragraphs: [
              'Mientras navegaba por el mar azul, Coco escuchó una melodía preciosa. "¿Quién canta tan bonito?", preguntó mirando a su alrededor.',
              'Era una ballena. "Hola, Coco. ¿Puedes ayudarme a encontrar mi eco?". Coco ladró con fuerza y la ballena sonrió al escuchar el sonido volver. "¡Gracias! Tu voz me ha hecho muy feliz".',
            ],
          },
          {
            title: 'Capítulo 3: El pulpo enredado',
            image: '/images/stories/barco/cap-3.webp',
            imageAlt: 'Coco ayuda a un pulpo atrapado en una red',
            paragraphs: [
              'Entre olas suaves, Coco vio burbujas y tentáculos. Un pulpo se había quedado atrapado en una red de pesca. "¡No puedo bailar!", se lamentaba.',
              'Coco mordisqueó la red hasta romperla y el pulpo quedó libre. Dio una pirueta de alegría y exclamó: "¡Eres un héroe de cuatro patas!".',
            ],
          },
          {
            title: 'Capítulo 4: La tormenta traviesa',
            image: '/images/stories/barco/cap-4.webp',
            imageAlt: 'Coco afronta una tormenta en el mar',
            paragraphs: [
              'El cielo se volvió gris. Rayos, truenos y viento hicieron que el barco se moviera. Coco se escondió un momento bajo una manta.',
              'Después pensó: "¿Y si las olas también tienen miedo?". Salió, miró al cielo y dijo con valentía: "Todo va a salir bien". Y la tormenta se marchó poco a poco.',
            ],
          },
          {
            title: 'Capítulo 5: El tesoro invisible',
            image: '/images/stories/barco/cap-5.webp',
            imageAlt: 'Coco descubre el mensaje de un tesoro en el mar',
            paragraphs: [
              'Una luz brilló sobre el agua. Coco siguió el reflejo y encontró una botella con un papel dentro.',
              'El mensaje decía: "El tesoro más brillante es tener amigos y ser valiente". Coco sonrió. "Este ha sido el mejor viaje de mi vida".',
            ],
          },
        ],
      },
      pt: {
        title: 'O Barco Encantado',
        summary: 'O Coco navega pelo mar, ajuda novos amigos e descobre um tesouro muito especial.',
        coverAlt: 'Capa da história O Barco Encantado',
        pages: [
          {
            title: 'Capítulo 1: O barco surpresa',
            image: '/images/stories/barco/cap-1.webp',
            imageAlt: 'O Coco encontra um barco no cais',
            paragraphs: [
              'Numa manhã, o Coco encontrou uma carta junto à sua tigela de comida. "Querido Coco, convidamos-te para uma viagem de barco. Assinado: Capitão Peixe".',
              'O Coco latiu de alegria e correu até ao cais. Lá estava um barquinho com uma bandeira a dizer: "A aventura começa aqui".',
            ],
          },
          {
            title: 'Capítulo 2: A baleia que cantava',
            image: '/images/stories/barco/cap-2.webp',
            imageAlt: 'O Coco ouve uma baleia a cantar no mar',
            paragraphs: [
              'A navegar pelo mar azul, o Coco ouviu uma melodia muito bonita. "Quem canta assim tão bem?", perguntou ele.',
              'Era uma baleia. "Olá, Coco. Podes ajudar-me a encontrar o meu eco?". O Coco latiu bem alto e a baleia sorriu ao ouvi-lo voltar. "Obrigada! A tua voz deixou-me feliz".',
            ],
          },
          {
            title: 'Capítulo 3: O polvo enrolado',
            image: '/images/stories/barco/cap-3.webp',
            imageAlt: 'O Coco ajuda um polvo preso numa rede',
            paragraphs: [
              'Entre ondas suaves, o Coco viu bolhas e tentáculos. Um polvo tinha ficado preso numa rede de pesca. "Não consigo dançar!", lamentou-se.',
              'O Coco roeu a rede até a abrir e libertou-o. O polvo deu uma pirueta de alegria e gritou: "És um herói de quatro patas!".',
            ],
          },
          {
            title: 'Capítulo 4: A tempestade traquina',
            image: '/images/stories/barco/cap-4.webp',
            imageAlt: 'O Coco enfrenta uma tempestade no mar',
            paragraphs: [
              'O céu ficou cinzento. Raios, trovões e vento abanavam o barco. O Coco escondeu-se por um momento debaixo de uma manta.',
              'Depois pensou: "E se as ondas também estiverem assustadas?". Saiu, olhou para o céu e disse com coragem: "Vai correr tudo bem". E a tempestade afastou-se devagar.',
            ],
          },
          {
            title: 'Capítulo 5: O tesouro invisível',
            image: '/images/stories/barco/cap-5.webp',
            imageAlt: 'O Coco encontra a mensagem de um tesouro no mar',
            paragraphs: [
              'Uma luz brilhou na água. O Coco seguiu o reflexo e encontrou uma garrafa com um papel lá dentro.',
              'A mensagem dizia: "O tesouro mais brilhante é ter amigos e ser corajoso". O Coco sorriu. "Esta foi a melhor viagem da minha vida".',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'moon',
    coverImage: '/images/stories/luna/portada.webp',
    theme: 'starlight',
    content: {
      es: {
        title: 'Coco y su viaje a la luna',
        summary: 'Una noche, Coco sueña que viaja a la luna y descubre que imaginar también es una aventura.',
        coverAlt: 'Portada del cuento Coco y su viaje a la luna',
        pages: [
          {
            title: 'Capítulo 1: Un deseo bajo las estrellas',
            image: '/images/stories/luna/cap-1.webp',
            imageAlt: 'Coco mira la luna desde su cama',
            paragraphs: [
              'Aquella noche, Coco miraba el cielo desde su camita. "Qué bonita está la luna", suspiró.',
              'Cerró los ojos y pensó: "¿Y si pudiera ir hasta allí?". Sin saber cómo, empezó a soñar y su cama se transformó en una nave espacial.',
            ],
          },
          {
            title: 'Capítulo 2: Traje de astronauta',
            image: '/images/stories/luna/cap-2.webp',
            imageAlt: 'Coco se pone un traje de astronauta',
            paragraphs: [
              'En el sueño, Coco se vio delante de un espejo con un traje espacial: casco, botas grandes y un botón que decía "¡Despegar!".',
              '"Estoy listo para mi aventura lunar", dijo dando saltitos. Pulsó el botón y la nave empezó a rugir.',
            ],
          },
          {
            title: 'Capítulo 3: Vuelo entre estrellas',
            image: '/images/stories/luna/cap-3.webp',
            imageAlt: 'Coco viaja entre estrellas y cometas',
            paragraphs: [
              'La nave voló suavemente entre las estrellas. Coco saludaba a los cometas, corría junto a meteoritos y chocó la pata con un satélite simpático.',
              '"Esto es todavía más bonito de lo que imaginaba", ladró muy feliz.',
            ],
          },
          {
            title: 'Capítulo 4: Patitas en la luna',
            image: '/images/stories/luna/cap-4.webp',
            imageAlt: 'Coco flota alegremente sobre la luna',
            paragraphs: [
              'Al llegar, Coco saltó y empezó a flotar en la luna como si fuera un muelle. "¡Estoy flotando! Qué divertido".',
              'Allí conoció a una estrella tímida que le dijo: "Pensaba que los sueños eran solo cosas de humanos, pero tú me has enseñado que no".',
            ],
          },
          {
            title: 'Capítulo 5: El mejor despertar',
            image: '/images/stories/luna/cap-5.webp',
            imageAlt: 'Coco despierta sonriente después de su sueño',
            paragraphs: [
              'Coco se despertó con la nariz sobre la almohada y una sonrisa enorme. Miró por la ventana y volvió a ver la luna.',
              '"A veces, soñar es el primer paso para llegar muy alto", dijo. Desde ese día nunca dejó de imaginar, porque sabía que los sueños también se entrenan.',
            ],
          },
        ],
      },
      pt: {
        title: 'Coco e a Sua Viagem à Lua',
        summary: 'Numa noite especial, o Coco sonha que viaja até à lua e descobre o poder de imaginar.',
        coverAlt: 'Capa da história Coco e a Sua Viagem à Lua',
        pages: [
          {
            title: 'Capítulo 1: Um desejo debaixo das estrelas',
            image: '/images/stories/luna/cap-1.webp',
            imageAlt: 'O Coco observa a lua da sua cama',
            paragraphs: [
              'Nessa noite, o Coco olhava o céu da sua caminha. "Que bonita está a lua", suspirou.',
              'Fechou os olhos e pensou: "E se eu pudesse ir lá acima?". Sem saber como, começou a sonhar e a sua cama transformou-se numa nave espacial.',
            ],
          },
          {
            title: 'Capítulo 2: Fato de astronauta',
            image: '/images/stories/luna/cap-2.webp',
            imageAlt: 'O Coco veste um fato de astronauta',
            paragraphs: [
              'No sonho, o Coco viu-se diante de um espelho com um fato espacial: capacete, botas grandes e um botão que dizia "Descolar!".',
              '"Estou pronto para a minha aventura lunar", disse aos saltinhos. Carregou no botão e a nave começou a rugir.',
            ],
          },
          {
            title: 'Capítulo 3: Voo entre estrelas',
            image: '/images/stories/luna/cap-3.webp',
            imageAlt: 'O Coco viaja entre estrelas e cometas',
            paragraphs: [
              'A nave voou suavemente entre as estrelas. O Coco acenava aos cometas, corria ao lado dos meteoritos e bateu a pata com um satélite simpático.',
              '"Isto é ainda mais bonito do que imaginava", latiu muito feliz.',
            ],
          },
          {
            title: 'Capítulo 4: Patas na lua',
            image: '/images/stories/luna/cap-4.webp',
            imageAlt: 'O Coco flutua alegremente na lua',
            paragraphs: [
              'Ao chegar, o Coco saltou e começou a flutuar na lua como se fosse uma mola. "Estou a flutuar. Que divertido".',
              'Ali conheceu uma estrela tímida que lhe disse: "Pensava que os sonhos eram só coisas de humanos, mas tu mostraste-me que não".',
            ],
          },
          {
            title: 'Capítulo 5: O melhor despertar',
            image: '/images/stories/luna/cap-5.webp',
            imageAlt: 'O Coco acorda sorridente depois do seu sonho',
            paragraphs: [
              'O Coco acordou com o nariz na almofada e um sorriso enorme. Olhou pela janela e voltou a ver a lua.',
              '"Às vezes, sonhar é o primeiro passo para voar alto", disse. E desde esse dia nunca deixou de imaginar, porque sabia que os sonhos também se treinam.',
            ],
          },
        ],
      },
    },
  },
] as const satisfies StoryDefinition[]

export function normalizeStoryLocale(locale: string): AppLocale {
  return locale.startsWith('pt') ? 'pt' : 'es'
}

export function getLocalizedStories(locale: string): LocalizedStory[] {
  const resolvedLocale = normalizeStoryLocale(locale)

  return STORIES.map((story) => ({
    id: story.id,
    coverImage: story.coverImage,
    theme: story.theme,
    ...story.content[resolvedLocale],
  }))
}

export function getLocalizedStory(storyId: StoryId, locale: string): LocalizedStory | null {
  const resolvedLocale = normalizeStoryLocale(locale)
  const story = STORIES.find((entry) => entry.id === storyId)

  if (!story) return null

  return {
    id: story.id,
    coverImage: story.coverImage,
    theme: story.theme,
    ...story.content[resolvedLocale],
  }
}
