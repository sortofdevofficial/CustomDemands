const STICKERS = [
  /* ── ANIME ── */
  {
    id: 1, name: "Pain 1",
    desc: "Custom die-cut Pain (Nagato) anime sticker — iconic Rinnegan eyes pose from Naruto Shippuden. Waterproof, high-gloss vinyl. Perfect for laptops, water bottles & phone cases.",
    image: "images/anime/pain1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 16, name: "Luffy 1",
    desc: "Monkey D. Luffy fist-raised friendship pose die-cut sticker from One Piece — vibrant vinyl sticker for anime fans. Waterproof & scratch-resistant. Ships across India.",
    image: "images/anime/luffy/luffy1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 33, name: "Luffy 2",
    desc: "Chibi Kid Luffy peeking with straw hat die-cut vinyl sticker — adorable One Piece fan art sticker ideal for laptops, journals and school bags. Custom Demands India.",
    image: "images/anime/luffy/luffy2.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 17, name: "Hakari 1",
    desc: "Hakari domain expansion pose die-cut sticker from Jujutsu Kaisen — premium waterproof vinyl sticker for JJK fans. Perfect for laptops, helmets, and notebooks.",
    image: "images/anime/hakari1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 18, name: "Gojo 1",
    desc: "Gojo Satoru head with signature sunglasses die-cut vinyl sticker — Jujutsu Kaisen fan art. Waterproof, glossy finish. One of India's most popular anime stickers.",
    image: "images/anime/gojo/gojo1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 19, name: "Gojo 2",
    desc: "Gojo Satoru running pose with blindfold die-cut anime sticker — JJK infinity arc artwork on premium vinyl. Waterproof sticker perfect for laptops and water bottles.",
    image: "images/anime/gojo/gojo2.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 28, name: "Gojo 3",
    desc: "Cute chibi Gojo Satoru smiling die-cut sticker — adorable kawaii-style Jujutsu Kaisen fan art. Dual category: Anime + Chibi. Premium vinyl sticker for JJK fans in India.",
    image: "images/anime/gojo/gojo3.png", style: ["anime","chibi"], price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 20, name: "Naruto 1",
    desc: "Naruto Uzumaki crouching ninja pose die-cut vinyl sticker — iconic Boruto arc artwork. Waterproof glossy sticker for anime fans. Available in custom sizes. Ships India-wide.",
    image: "images/anime/naruto1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 21, name: "Kurama 1",
    desc: "Kurama Nine-Tails Fox Beast die-cut vinyl sticker — powerful Naruto fan art sticker. High-gloss waterproof print for laptops, helmets, gaming setups. Custom Demands India.",
    image: "images/anime/kurama1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 22, name: "L Lawliet 1",
    desc: "Chibi L Lawliet die-cut sticker from Death Note — iconic detective with signature hair and crouching pose. Premium waterproof vinyl. Fan favourite for anime sticker collections.",
    image: "images/anime/LLawliet1.png", style: ["anime","chibi"], price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 23, name: "Itachi 1",
    desc: "Funny Itachi Uchiha pose die-cut anime sticker — humorous Naruto fan art on premium waterproof vinyl. Great for laptops, bottles, and car windows. Ships pan-India.",
    image: "images/anime/itachi/itachi1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 24, name: "Itachi 2",
    desc: "Itachi Uchiha sitting pose with Sharingan background die-cut vinyl sticker — dramatic Naruto Shippuden artwork. Waterproof gloss finish. Custom sizes available.",
    image: "images/anime/itachi/itachi2.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 25, name: "Goku 1",
    desc: "Goku standing power pose die-cut Dragon Ball Z sticker — fierce expression, vibrant colours on premium waterproof vinyl. Must-have DBZ sticker for anime fans in India.",
    image: "images/anime/goku/goku1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 34, name: "Goku 2",
    desc: "Chibi Super Saiyan Goku with aura die-cut sticker — adorable Dragon Ball Z fan art with golden glow effect. Dual Anime + Chibi style. Waterproof vinyl sticker India.",
    image: "images/anime/goku/goku2.png", style: ["anime","chibi"], price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 26, name: "Zoro 1",
    desc: "Roronoa Zoro standing with Wado Ichimonji die-cut vinyl sticker — One Piece swordsman fan art. Waterproof, high-gloss finish. Popular anime sticker for laptop and helmet.",
    image: "images/anime/zoro/zoro1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 27, name: "Zoro 2",
    desc: "Zoro three-sword style pose die-cut One Piece sticker — premium waterproof vinyl featuring Santoryu stance. One of the best anime stickers for One Piece fans in India.",
    image: "images/anime/zoro/zoro2.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 32, name: "Zoro Swords 1",
    desc: "Wado Ichimonji, Sandai Kitetsu and Enma three swords die-cut vinyl sticker — iconic One Piece weapon art. Detailed gloss print, waterproof. Perfect for weapon and anime lovers.",
    image: "images/anime/swords/Wado Ichimonji, Sandai Kitetsu, and Enma 1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×3 in", "3×4 in", "4×5 in"]
  },
  {
    id: 29, name: "Sasuke 1",
    desc: "Sasuke Uchiha sword pose die-cut vinyl sticker from Naruto Shippuden — sharp linework, vibrant colours on premium waterproof vinyl. Top-selling anime sticker in India.",
    image: "images/anime/sasuke/sasuke1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 30, name: "Sasuke 2",
    desc: "Kid Sasuke with Konoha headband and Uchiha clan symbol doing jutsu — die-cut Naruto sticker. Premium waterproof gloss vinyl. Nostalgic fan art for Naruto sticker collectors.",
    image: "images/anime/sasuke/sasuke2.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 35, name: "Jiraiya 1",
    desc: "Jiraiya Sannin die-cut vinyl sticker — white-haired legendary ninja with forehead protector and spiral seal emblem from Naruto. Waterproof gloss print. Custom Demands India.",
    image: "images/anime/jiraiya1.png", style: "anime", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },

  /* ── HELLO KITTY ── */
  {
    id: 2, name: "Hello Kitty 1",
    desc: "Classic Hello Kitty standing pose die-cut vinyl sticker — iconic Sanrio character on premium waterproof gloss vinyl. Adorable kawaii sticker for laptops, phones and bags. Ships India-wide.",
    image: "images/HelloKitty/HelloKitty1.png", style: "hellokitty", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 3, name: "Hello Kitty 2",
    desc: "Hello Kitty peeking from behind a ribbon die-cut sticker — cute Sanrio fan art on waterproof gloss vinyl. Perfect kawaii sticker for phone cases, notebooks and water bottles.",
    image: "images/HelloKitty/HelloKitty2.png", style: "hellokitty", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 4, name: "Hello Kitty 3",
    desc: "Hello Kitty head with iconic red bow die-cut vinyl sticker — Sanrio fan art sticker. Premium waterproof finish. One of India's best-selling kawaii stickers for girls and collectors.",
    image: "images/HelloKitty/HelloKitty3.png", style: "hellokitty", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 5, name: "Hello Kitty 4",
    desc: "Hello Kitty sitting with strawberry die-cut sticker — sweet kawaii Sanrio artwork on premium waterproof vinyl. Adorable sticker for girls' laptops, lunch boxes and accessories.",
    image: "images/HelloKitty/HelloKitty4.png", style: "hellokitty", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },

  /* ── HARRY POTTER ── */
  {
    id: 6, name: "Harry Potter 1",
    desc: "Chibi Harry Potter with wand and round glasses die-cut vinyl sticker — adorable Hogwarts fan art. Waterproof gloss sticker perfect for HP fans, journals, and laptop covers in India.",
    image: "images/harrypotter/HarryPotter1.png", style: ["harrypotter","chibi"], price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 7, name: "Hermione Granger 1",
    desc: "Chibi Hermione Granger with bushy hair die-cut sticker — adorable Harry Potter Gryffindor fan art on premium waterproof vinyl. Best HP sticker for book and movie fans in India.",
    image: "images/harrypotter/HermioneGranger1.png", style: ["harrypotter","chibi"], price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 8, name: "Ron Weasley 1",
    desc: "Chibi Ron Weasley with red hair and freckles die-cut vinyl sticker — Harry Potter fan art. Waterproof glossy sticker, perfect for Weasley fans and HP collectors across India.",
    image: "images/harrypotter/RonWeasley1.png", style: ["harrypotter","chibi"], price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 9, name: "Rubeus Hagrid 1",
    desc: "Chibi Rubeus Hagrid with giant beard and kind eyes die-cut HP sticker — beloved Hogwarts gamekeeper fan art on premium waterproof vinyl. Great gift for Harry Potter fans.",
    image: "images/harrypotter/RubeusHagrid1.png", style: ["harrypotter","chibi"], price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 10, name: "Severus Snape 1",
    desc: "Chibi Severus Snape with signature scowl and dark hair die-cut vinyl sticker — iconic HP Potions master fan art. Waterproof gloss finish. Popular Harry Potter sticker in India.",
    image: "images/harrypotter/SeverusSnape1.png", style: ["harrypotter","chibi"], price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 11, name: "Albus Dumbledore 1",
    desc: "Chibi Albus Dumbledore with long beard and half-moon glasses die-cut sticker — Hogwarts Headmaster fan art. Premium waterproof vinyl. Must-have for Harry Potter collectors.",
    image: "images/harrypotter/AlbusDumbledore1.png", style: ["harrypotter","chibi"], price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 12, name: "Draco Malfoy 1",
    desc: "Chibi Draco Malfoy with slicked-back blonde hair and sly expression — die-cut Slytherin HP sticker on premium waterproof vinyl. Fan favourite Harry Potter sticker in India.",
    image: "images/harrypotter/DracoMalfoy1.png", style: ["harrypotter","chibi"], price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 13, name: "Luna Lovegood 1",
    desc: "Chibi Luna Lovegood with dreamy eyes and distinctive glasses die-cut HP sticker — Ravenclaw fan art on waterproof gloss vinyl. Beloved Harry Potter sticker for Potterheads.",
    image: "images/harrypotter/LunaLovegood1.png", style: ["harrypotter","chibi"], price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 14, name: "Sorting Hat 1",
    desc: "Sorting Hat die-cut vinyl sticker — iconic Hogwarts hat fan art from Harry Potter. Premium waterproof gloss sticker for HP fans, school bags and laptop covers across India.",
    image: "images/harrypotter/SortingHat1.png", style: "harrypotter", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 15, name: "Harry Potter Logo 1",
    desc: "Harry Potter lightning bolt logo die-cut vinyl sticker — iconic HP emblem on premium waterproof gloss vinyl. Perfect gift sticker for Potterheads and HP fans in India.",
    image: "images/harrypotter/HarryPotterLogo1.png", style: "harrypotter", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },

  /* ── MARVEL ── */
  {
    id: 31, name: "Spider-Man 1",
    desc: "Spider-Man web-swinging die-cut vinyl sticker — premium Marvel fan art sticker with bold colours on waterproof gloss vinyl. Best superhero sticker for laptops and helmets in India.",
    image: "images/marvel/spiderman1.png", style: "marvel", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },
  {
    id: 36, name: "Iron Man 1",
    desc: "Iron Man flying in red-gold suit die-cut Marvel vinyl sticker — premium MCU fan art sticker. Waterproof, scratch-resistant gloss finish. Top-selling superhero sticker in India.",
    image: "images/marvel/ironman1.png", style: "marvel", price: 10, inStock: true,
    sizes: ["2×2 in", "3×3 in", "4×4 in"]
  },

];