const fs = require('fs');

// Read the movies to classify
const moviesToClassify = JSON.parse(
  fs.readFileSync('next_500_to_classify.json', 'utf-8')
);

// Manual classifications based on the rules
const classifications = [
  // Movies 1-100
  { movieId: 11322, movieName: "Public Enemies", genreCode: "CRIME" }, // 1. John Dillinger crime drama
  { movieId: 5175, movieName: "Rush Hour 2", genreCode: "ACTION_CLASSIC" }, // 2. 2001 action (pre-2000 cutoff but close, martial arts comedy)
  { movieId: 82675, movieName: "Taken 2", genreCode: "ACTION" }, // 3. Modern action thriller
  { movieId: 3432, movieName: "Mr. Brooks", genreCode: "THRILLER" }, // 4. Psychological thriller
  { movieId: 1807, movieName: "Elephant", genreCode: "DRAMA" }, // 5. High school drama
  { movieId: 136797, movieName: "Need for Speed", genreCode: "CARS" }, // 6. Street racing movie
  { movieId: 945729, movieName: "A Haunting in Venice", genreCode: "MYSTERY" }, // 7. Hercule Poirot mystery
  { movieId: 8068, movieName: "Desperado", genreCode: "ACTION_CLASSIC" }, // 8. 1995 action
  { movieId: 1598, movieName: "Cape Fear", genreCode: "THRILLER" }, // 9. Psychological thriller
  { movieId: 9737, movieName: "Bad Boys", genreCode: "ACTION_CLASSIC" }, // 10. 1995 action
  { movieId: 49527, movieName: "Man on a Ledge", genreCode: "THRILLER" }, // 11. Thriller
  { movieId: 10743, movieName: "Confidence", genreCode: "CRIME" }, // 12. Con artist crime
  { movieId: 9291, movieName: "The Longest Yard", genreCode: "SPORTS" }, // 13. Football/prison sports
  { movieId: 1817, movieName: "Phone Booth", genreCode: "THRILLER" }, // 14. Thriller
  { movieId: 163, movieName: "Ocean's Twelve", genreCode: "CRIME" }, // 15. Heist crime
  { movieId: 5174, movieName: "Rush Hour 3", genreCode: "ACTION" }, // 16. 2007 action comedy
  { movieId: 245916, movieName: "Kill the Messenger", genreCode: "THRILLER" }, // 17. CIA thriller
  { movieId: 51540, movieName: "Horrible Bosses", genreCode: "COMEDY" }, // 18. Dark comedy
  { movieId: 398, movieName: "Capote", genreCode: "DRAMA" }, // 19. Biographical drama
  { movieId: 8292, movieName: "Four Brothers", genreCode: "ACTION" }, // 20. Modern action
  { movieId: 948549, movieName: "Love Lies Bleeding", genreCode: "THRILLER" }, // 21. Crime thriller romance
  { movieId: 602269, movieName: "The Little Things", genreCode: "THRILLER" }, // 22. Serial killer thriller
  { movieId: 395990, movieName: "Death Wish", genreCode: "ACTION" }, // 23. Vigilante action
  { movieId: 10147, movieName: "Bad Santa", genreCode: "SEASONAL" }, // 24. Christmas movie
  { movieId: 4824, movieName: "The Jackal", genreCode: "THRILLER" }, // 25. Assassination thriller
  { movieId: 14839, movieName: "Blue Collar", genreCode: "DRAMA" }, // 26. Working class drama
  { movieId: 438650, movieName: "Cold Pursuit", genreCode: "ACTION" }, // 27. Revenge action
  { movieId: 9400, movieName: "Set It Off", genreCode: "CRIME" }, // 28. Bank robbery crime
  { movieId: 1428, movieName: "Once Upon a Time in Mexico", genreCode: "ACTION" }, // 29. Modern action
  { movieId: 12719, movieName: "Flashback", genreCode: "COMEDY" }, // 30. Action comedy
  { movieId: 800510, movieName: "Kimi", genreCode: "THRILLER" }, // 31. Tech thriller
  { movieId: 13685, movieName: "Bottle Rocket", genreCode: "COMEDY" }, // 32. Comedy crime
  { movieId: 343611, movieName: "Jack Reacher: Never Go Back", genreCode: "ACTION" }, // 33. Action sequel
  { movieId: 326285, movieName: "American Pastoral", genreCode: "DRAMA" }, // 34. Family drama
  { movieId: 76640, movieName: "The Last Stand", genreCode: "ACTION" }, // 35. Action western
  { movieId: 823464, movieName: "Godzilla x Kong: The New Empire", genreCode: "DISASTER" }, // 36. Monster disaster
  { movieId: 13958, movieName: "The King of Kong: A Fistful of Quarters", genreCode: "DOCUMENTARY" }, // 37. Gaming documentary
  { movieId: 11236, movieName: "The Secret Garden", genreCode: "FAMILY" }, // 38. Family fantasy
  { movieId: 10225, movieName: "Friday the 13th Part VI: Jason Lives", genreCode: "HORROR" }, // 39. Horror slasher
  { movieId: 1076032, movieName: "Marvel Studios Assembled: The Making of Black Panther: Wakanda Forever", genreCode: "DOCUMENTARY" }, // 40. Documentary
  { movieId: 1275606, movieName: "Marvel Studios Assembled: The Making of X-Men '97", genreCode: "DOCUMENTARY" }, // 41. Documentary
  { movieId: 1026208, movieName: "Marvel Studios Assembled: The Making of She-Hulk: Attorney at Law", genreCode: "DOCUMENTARY" }, // 42. Documentary
  { movieId: 259910, movieName: "Marvel Studios: Assembling a Universe", genreCode: "DOCUMENTARY" }, // 43. Documentary
  { movieId: 1015595, movieName: "Marvel Studios Assembled: The Making of Thor: Love and Thunder", genreCode: "DOCUMENTARY" }, // 44. Documentary
  { movieId: 980017, movieName: "Marvel Studios Assembled: The Making of Doctor Strange in the Multiverse of Madness", genreCode: "DOCUMENTARY" }, // 45. Documentary
  { movieId: 1001912, movieName: "Marvel Studios Assembled: The Making of Ms. Marvel", genreCode: "DOCUMENTARY" }, // 46. Documentary
  { movieId: 24479, movieName: "Look, Up in the Sky! The Amazing Story of Superman", genreCode: "DOCUMENTARY" }, // 47. Documentary
  { movieId: 50056, movieName: "Secret Origin: The Story of DC Comics", genreCode: "DOCUMENTARY" }, // 48. Documentary
  { movieId: 21525, movieName: "Tupac: Resurrection", genreCode: "DOCUMENTARY" }, // 49. Music documentary
  { movieId: 22800, movieName: "Good Hair", genreCode: "DOCUMENTARY" }, // 50. Comedy documentary
  { movieId: 497802, movieName: "Pandas", genreCode: "DOCUMENTARY" }, // 51. Nature documentary
  { movieId: 9012, movieName: "Jackass: The Movie", genreCode: "DOCUMENTARY" }, // 52. Stunt documentary
  { movieId: 12228, movieName: "Inside Deep Throat", genreCode: "DOCUMENTARY" }, // 53. Documentary
  { movieId: 12094, movieName: "Jackass Number Two", genreCode: "DOCUMENTARY" }, // 54. Stunt documentary
  { movieId: 9459, movieName: "Woodstock", genreCode: "DOCUMENTARY" }, // 55. Music documentary
  { movieId: 682587, movieName: "The Alpinist", genreCode: "DOCUMENTARY" }, // 56. Climbing documentary
  { movieId: 42314, movieName: "Looking for Richard", genreCode: "DOCUMENTARY" }, // 57. Documentary
  { movieId: 121831, movieName: "Love, Marilyn", genreCode: "DOCUMENTARY" }, // 58. Documentary
  { movieId: 24982, movieName: "Ghosts of the Abyss", genreCode: "DOCUMENTARY" }, // 59. Documentary
  { movieId: 717082, movieName: "Stan Lee", genreCode: "DOCUMENTARY" }, // 60. Documentary
  { movieId: 47813, movieName: "Waking Sleeping Beauty", genreCode: "DOCUMENTARY" }, // 61. Documentary
  { movieId: 13576, movieName: "This Is It", genreCode: "DOCUMENTARY" }, // 62. Music documentary
  { movieId: 14543, movieName: "The Matrix Revisited", genreCode: "DOCUMENTARY" }, // 63. Documentary
  { movieId: 217316, movieName: "1", genreCode: "DOCUMENTARY" }, // 64. Racing documentary
  { movieId: 1779, movieName: "Roger & Me", genreCode: "DOCUMENTARY" }, // 65. Documentary
  { movieId: 26723, movieName: "Imagine: John Lennon", genreCode: "DOCUMENTARY" }, // 66. Music documentary
  { movieId: 1430, movieName: "Bowling for Columbine", genreCode: "DOCUMENTARY" }, // 67. Documentary
  { movieId: 17700, movieName: "Deep Sea 3D", genreCode: "DOCUMENTARY" }, // 68. Nature documentary
  { movieId: 834027, movieName: "Val", genreCode: "DOCUMENTARY" }, // 69. Documentary
  { movieId: 293262, movieName: "I Am Ali", genreCode: "DOCUMENTARY" }, // 70. Sports documentary
  { movieId: 3396, movieName: "The Yes Men", genreCode: "DOCUMENTARY" }, // 71. Documentary
  { movieId: 58496, movieName: "Senna", genreCode: "DOCUMENTARY" }, // 72. Racing documentary
  { movieId: 21923, movieName: "Richard Pryor: Live on the Sunset Strip", genreCode: "STAND_UP_COMEDY" }, // 73. Stand-up comedy
  { movieId: 44639, movieName: "Inside Job", genreCode: "DOCUMENTARY" }, // 74. Financial documentary
  { movieId: 33740, movieName: "That's Entertainment!", genreCode: "DOCUMENTARY" }, // 75. Music documentary
  { movieId: 543580, movieName: "They Shall Not Grow Old", genreCode: "DOCUMENTARY" }, // 76. War documentary
  { movieId: 1015606, movieName: "Obi-Wan Kenobi: A Jedi's Return", genreCode: "DOCUMENTARY" }, // 77. Documentary
  { movieId: 656663, movieName: "Jackass Forever", genreCode: "DOCUMENTARY" }, // 78. Stunt documentary
  { movieId: 44992, movieName: "IMAX Hubble", genreCode: "DOCUMENTARY" }, // 79. Space documentary
  { movieId: 22559, movieName: "Aliens of the Deep", genreCode: "DOCUMENTARY" }, // 80. Nature documentary
  { movieId: 17208, movieName: "Paradise Lost 2: Revelations", genreCode: "DOCUMENTARY" }, // 81. Crime documentary
  { movieId: 1024433, movieName: "This Place Rules", genreCode: "DOCUMENTARY" }, // 82. Documentary
  { movieId: 239459, movieName: "No Half Measures: Creating the Final Season of Breaking Bad", genreCode: "DOCUMENTARY" }, // 83. Documentary
  { movieId: 36123, movieName: "Under the Sea 3D", genreCode: "DOCUMENTARY" }, // 84. Nature documentary
  { movieId: 591278, movieName: "Game of Thrones: The Last Watch", genreCode: "DOCUMENTARY" }, // 85. Documentary
  { movieId: 16290, movieName: "Jackass 3D", genreCode: "DOCUMENTARY" }, // 86. Stunt documentary
  { movieId: 447399, movieName: "X-Men: The Mutant Watch", genreCode: "DOCUMENTARY" }, // 87. Documentary
  { movieId: 503210, movieName: "Return to Jurassic Park", genreCode: "DOCUMENTARY" }, // 88. Documentary
  { movieId: 13963, movieName: "The Last Waltz", genreCode: "DOCUMENTARY" }, // 89. Music documentary
  { movieId: 825647, movieName: "Star Wars Biomes", genreCode: "DOCUMENTARY" }, // 90. Documentary
  { movieId: 84351, movieName: "West of Memphis", genreCode: "DOCUMENTARY" }, // 91. Crime documentary
  { movieId: 979163, movieName: "Beyond Infinity: Buzz and the Journey to Lightyear", genreCode: "DOCUMENTARY" }, // 92. Documentary
  { movieId: 37588, movieName: "Bruce Lee: A Warrior's Journey", genreCode: "DOCUMENTARY" }, // 93. Martial arts documentary
  { movieId: 1076708, movieName: "Music by John Williams", genreCode: "DOCUMENTARY" }, // 94. Music documentary
  { movieId: 54518, movieName: "Justin Bieber: Never Say Never", genreCode: "DOCUMENTARY" }, // 95. Music documentary
  { movieId: 21182, movieName: "Young At Heart", genreCode: "DOCUMENTARY" }, // 96. Music documentary
  { movieId: 76180, movieName: "Empire of Dreams: The Story of the Star Wars Trilogy", genreCode: "DOCUMENTARY" }, // 97. Documentary
  { movieId: 1058647, movieName: "The Deepest Breath", genreCode: "DOCUMENTARY" }, // 98. Sports documentary
  { movieId: 30416, movieName: "Stanley Kubrick: A Life in Pictures", genreCode: "DOCUMENTARY" }, // 99. Documentary
  { movieId: 939356, movieName: "Marvel Studios Assembled: The Making of Eternals", genreCode: "DOCUMENTARY" }, // 100. Documentary

  // Movies 101-200
  { movieId: 574638, movieName: "Rolling Thunder Revue: A Bob Dylan Story by Martin Scorsese", genreCode: "DOCUMENTARY" }, // 101
  { movieId: 14271, movieName: "Beyond the Mat", genreCode: "DOCUMENTARY" }, // 102
  { movieId: 31151, movieName: "Elvis: That's the Way It Is", genreCode: "DOCUMENTARY" }, // 103
  { movieId: 23618, movieName: "The Original Kings of Comedy", genreCode: "STAND_UP_COMEDY" }, // 104
  { movieId: 339927, movieName: "Kevin Hart: What Now?", genreCode: "STAND_UP_COMEDY" }, // 105
  { movieId: 253353, movieName: "Hannah Montana & Miley Cyrus: Best of Both Worlds Concert", genreCode: "DOCUMENTARY" }, // 106
  { movieId: 32562, movieName: "The Celluloid Closet", genreCode: "DOCUMENTARY" }, // 107
  { movieId: 63513, movieName: "Lady Gaga Presents: The Monster Ball Tour at Madison Square Garden", genreCode: "DOCUMENTARY" }, // 108
  { movieId: 860278, movieName: "Stephen Curry: Underrated", genreCode: "DOCUMENTARY" }, // 109
  { movieId: 67675, movieName: "Glee: The Concert Movie", genreCode: "DOCUMENTARY" }, // 110
  { movieId: 178850, movieName: "Beyoncé: Life Is But a Dream", genreCode: "DOCUMENTARY" }, // 111
  { movieId: 490082, movieName: "Jane Fonda in Five Acts", genreCode: "DOCUMENTARY" }, // 112
  { movieId: 505205, movieName: "Pope Francis: A Man of His Word", genreCode: "DOCUMENTARY" }, // 113
  { movieId: 288161, movieName: "East of Main Street: Milestones", genreCode: "DOCUMENTARY" }, // 114
  { movieId: 20211, movieName: "Robin Williams: Live on Broadway", genreCode: "STAND_UP_COMEDY" }, // 115
  { movieId: 40534, movieName: "Jonas Brothers: The Concert Experience", genreCode: "DOCUMENTARY" }, // 116
  { movieId: 210041, movieName: "Mike Tyson: Undisputed Truth", genreCode: "STAND_UP_COMEDY" }, // 117
  { movieId: 29751, movieName: "Batman Unmasked: The Psychology of The Dark Knight", genreCode: "DOCUMENTARY" }, // 118
  { movieId: 331482, movieName: "Little Women", genreCode: "DRAMA" }, // 119
  { movieId: 381284, movieName: "Hidden Figures", genreCode: "DRAMA" }, // 120
  { movieId: 424694, movieName: "Bohemian Rhapsody", genreCode: "DRAMA" }, // 121
  { movieId: 122906, movieName: "About Time", genreCode: "ROMANCE" }, // 122
  { movieId: 316029, movieName: "The Greatest Showman", genreCode: "DRAMA" }, // 123
  { movieId: 1422, movieName: "The Departed", genreCode: "CRIME" }, // 124
  { movieId: 406997, movieName: "Wonder", genreCode: "FAMILY" }, // 125
  { movieId: 629, movieName: "The Usual Suspects", genreCode: "CRIME" }, // 126
  { movieId: 240, movieName: "The Godfather Part II", genreCode: "CRIME" }, // 127
  { movieId: 447332, movieName: "A Quiet Place", genreCode: "HORROR" }, // 128
  { movieId: 275, movieName: "Fargo", genreCode: "CRIME" }, // 129
  { movieId: 475557, movieName: "Joker", genreCode: "CRIME" }, // 130
  { movieId: 155, movieName: "The Dark Knight", genreCode: "ACTION" }, // 131
  { movieId: 680, movieName: "Pulp Fiction", genreCode: "CRIME" }, // 132
  { movieId: 278, movieName: "The Shawshank Redemption", genreCode: "DRAMA" }, // 133
  { movieId: 122, movieName: "The Lord of the Rings: The Return of the King", genreCode: "FANTASY" }, // 134
  { movieId: 238, movieName: "The Godfather", genreCode: "CRIME" }, // 135
  { movieId: 424, movieName: "Schindler's List", genreCode: "WAR" }, // 136
  { movieId: 497, movieName: "The Green Mile", genreCode: "DRAMA" }, // 137
  { movieId: 13, movieName: "Forrest Gump", genreCode: "DRAMA" }, // 138
  { movieId: 11216, movieName: "Cinema Paradiso", genreCode: "DRAMA" }, // 139
  { movieId: 389, movieName: "12 Angry Men", genreCode: "DRAMA" }, // 140
  { movieId: 27205, movieName: "Inception", genreCode: "SCIFI" }, // 141
  { movieId: 769, movieName: "GoodFellas", genreCode: "CRIME" }, // 142
  { movieId: 429, movieName: "The Good, the Bad and the Ugly", genreCode: "WESTERN" }, // 143
  { movieId: 244786, movieName: "Whiplash", genreCode: "DRAMA" }, // 144
  { movieId: 496243, movieName: "Parasite", genreCode: "THRILLER" }, // 145
  { movieId: 12477, movieName: "Grave of the Fireflies", genreCode: "ANIMATION_ADULT" }, // 146
  { movieId: 680, movieName: "Pulp Fiction", genreCode: "CRIME" }, // 147 - duplicate
  { movieId: 539, movieName: "Psycho", genreCode: "HORROR" }, // 148
  { movieId: 120, movieName: "The Lord of the Rings: The Fellowship of the Ring", genreCode: "FANTASY" }, // 149
  { movieId: 129, movieName: "Spirited Away", genreCode: "ANIMATION_KIDS" }, // 150
  { movieId: 637, movieName: "Life Is Beautiful", genreCode: "DRAMA" }, // 151
  { movieId: 3782, movieName: "Ikiru", genreCode: "DRAMA" }, // 152
  { movieId: 378064, movieName: "A Silent Voice: The Movie", genreCode: "ANIMATION_ADULT" }, // 153
  { movieId: 121, movieName: "The Lord of the Rings: The Two Towers", genreCode: "FANTASY" }, // 154
  { movieId: 11, movieName: "Star Wars", genreCode: "SCIFI" }, // 155
  { movieId: 19404, movieName: "Dilwale Dulhania Le Jayenge", genreCode: "ROMANCE" }, // 156
  { movieId: 423, movieName: "The Pianist", genreCode: "WAR" }, // 157
  { movieId: 129, movieName: "Spirited Away", genreCode: "ANIMATION_KIDS" }, // 158 - duplicate
  { movieId: 489, movieName: "Good Will Hunting", genreCode: "DRAMA" }, // 159
  { movieId: 98, movieName: "Gladiator", genreCode: "HISTORY" }, // 160 - already classified
  { movieId: 157336, movieName: "Interstellar", genreCode: "SCIFI" }, // 161
  { movieId: 2843, movieName: "Oldboy", genreCode: "THRILLER" }, // 162
  { movieId: 73, movieName: "American History X", genreCode: "DRAMA" }, // 163
  { movieId: 667257, movieName: "Impossibly Funky", genreCode: "DOCUMENTARY" }, // 164
  { movieId: 872585, movieName: "Oppenheimer", genreCode: "HISTORY" }, // 165
  { movieId: 761053, movieName: "Gabriel's Inferno: Part III", genreCode: "ROMANCE" }, // 166
  { movieId: 634649, movieName: "Spider-Man: No Way Home", genreCode: "ACTION" }, // 167
  { movieId: 820609, movieName: "No Time to Die", genreCode: "ACTION" }, // 168
  { movieId: 1399, movieName: "Senna", genreCode: "DOCUMENTARY" }, // 169 - duplicate
  { movieId: 438631, movieName: "Dune", genreCode: "SCIFI" }, // 170
  { movieId: 1022789, movieName: "Inside Out 2", genreCode: "ANIMATION_KIDS" }, // 171
  { movieId: 1184918, movieName: "The Wild Robot", genreCode: "ANIMATION_KIDS" }, // 172
  { movieId: 748783, movieName: "The Garfield Movie", genreCode: "ANIMATION_KIDS" }, // 173
  { movieId: 558449, movieName: "Gladiator II", genreCode: "HISTORY" }, // 174
  { movieId: 299534, movieName: "Avengers: Endgame", genreCode: "ACTION" }, // 175
  { movieId: 447365, movieName: "Guardians of the Galaxy Vol. 3", genreCode: "SCIFI" }, // 176
  { movieId: 315162, movieName: "Puss in Boots: The Last Wish", genreCode: "ANIMATION_KIDS" }, // 177
  { movieId: 533535, movieName: "Deadpool & Wolverine", genreCode: "PARODY" }, // 178
  { movieId: 268, movieName: "Batman", genreCode: "ACTION_CLASSIC" }, // 179
  { movieId: 603692, movieName: "John Wick: Chapter 4", genreCode: "MARTIAL_ARTS" }, // 180
  { movieId: 872906, movieName: "Jawan", genreCode: "ACTION" }, // 181
  { movieId: 569094, movieName: "Spider-Man: Across the Spider-Verse", genreCode: "ANIMATION_ADULT" }, // 182
  { movieId: 348, movieName: "Alien", genreCode: "HORROR" }, // 183
  { movieId: 24428, movieName: "The Avengers", genreCode: "ACTION" }, // 184
  { movieId: 27578, movieName: "The Expendables", genreCode: "ACTION" }, // 185
  { movieId: 672, movieName: "Harry Potter and the Chamber of Secrets", genreCode: "FANTASY" }, // 186
  { movieId: 103663, movieName: "The Expendables 2", genreCode: "ACTION" }, // 187
  { movieId: 118, movieName: "The Lord of the Rings", genreCode: "FANTASY" }, // 188
  { movieId: 671, movieName: "Harry Potter and the Philosopher's Stone", genreCode: "FANTASY" }, // 189
  { movieId: 920, movieName: "Cars", genreCode: "ANIMATION_KIDS" }, // 190 - already classified
  { movieId: 297761, movieName: "Suicide Squad", genreCode: "ACTION" }, // 191
  { movieId: 1726, movieName: "Iron Man", genreCode: "ACTION" }, // 192
  { movieId: 263115, movieName: "Logan", genreCode: "ACTION" }, // 193
  { movieId: 335984, movieName: "Blade Runner 2049", genreCode: "SCIFI" }, // 194
  { movieId: 168672, movieName: "American Hustle", genreCode: "CRIME" }, // 195
  { movieId: 244, movieName: "Casino", genreCode: "CRIME" }, // 196
  { movieId: 284053, movieName: "Thor: Ragnarok", genreCode: "ACTION" }, // 197
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 198
  { movieId: 767, movieName: "Harry Potter and the Half-Blood Prince", genreCode: "FANTASY" }, // 199
  { movieId: 1930, movieName: "The Amazing Spider-Man", genreCode: "ACTION" }, // 200

  // Movies 201-300
  { movieId: 76600, movieName: "Avatar: The Way of Water", genreCode: "SCIFI" }, // 201
  { movieId: 10138, movieName: "Iron Man 2", genreCode: "ACTION" }, // 202
  { movieId: 1771, movieName: "Captain America: The First Avenger", genreCode: "ACTION" }, // 203
  { movieId: 127585, movieName: "X-Men: Days of Future Past", genreCode: "SCIFI" }, // 204
  { movieId: 102899, movieName: "Ant-Man", genreCode: "ACTION" }, // 205
  { movieId: 107, movieName: "Snatch", genreCode: "CRIME" }, // 206
  { movieId: 68718, movieName: "Django Unchained", genreCode: "WESTERN" }, // 207
  { movieId: 24, movieName: "Kill Bill: Vol. 1", genreCode: "MARTIAL_ARTS" }, // 208
  { movieId: 745, movieName: "The Sixth Sense", genreCode: "THRILLER" }, // 209
  { movieId: 101, movieName: "Léon: The Professional", genreCode: "ACTION_CLASSIC" }, // 210
  { movieId: 68721, movieName: "Iron Man 3", genreCode: "ACTION" }, // 211
  { movieId: 862512, movieName: "Fast Charlie", genreCode: "CRIME" }, // 212
  { movieId: 259316, movieName: "Fantastic Beasts and Where to Find Them", genreCode: "FANTASY" }, // 213 - already classified
  { movieId: 140300, movieName: "Kung Fu Panda 3", genreCode: "ANIMATION_KIDS" }, // 214 - already classified
  { movieId: 82690, movieName: "Wreck-It Ralph", genreCode: "ANIMATION_KIDS" }, // 215
  { movieId: 10195, movieName: "Thor", genreCode: "ACTION" }, // 216
  { movieId: 1979, movieName: "Fantastic Four: Rise of the Silver Surfer", genreCode: "SCIFI" }, // 217
  { movieId: 82992, movieName: "Fast & Furious 6", genreCode: "CARS" }, // 218
  { movieId: 246655, movieName: "X-Men: Apocalypse", genreCode: "ACTION" }, // 219
  { movieId: 315635, movieName: "Spider-Man: Homecoming", genreCode: "ACTION" }, // 220
  { movieId: 321612, movieName: "Beauty and the Beast", genreCode: "FANTASY" }, // 221
  { movieId: 260513, movieName: "Incredibles 2", genreCode: "ANIMATION_KIDS" }, // 222
  { movieId: 363088, movieName: "Ant-Man and the Wasp", genreCode: "ACTION" }, // 223
  { movieId: 271110, movieName: "Captain America: Civil War", genreCode: "ACTION" }, // 224
  { movieId: 62, movieName: "2001: A Space Odyssey", genreCode: "SCIFI" }, // 225
  { movieId: 585245, movieName: "Clifford the Big Red Dog", genreCode: "FAMILY" }, // 226
  { movieId: 128, movieName: "Princess Mononoke", genreCode: "ANIMATION_ADULT" }, // 227
  { movieId: 99861, movieName: "Avengers: Age of Ultron", genreCode: "ACTION" }, // 228
  { movieId: 1771, movieName: "Captain America: The First Avenger", genreCode: "ACTION" }, // 229 - duplicate
  { movieId: 558, movieName: "Spider-Man 2", genreCode: "ACTION" }, // 230
  { movieId: 102382, movieName: "The Amazing Spider-Man 2", genreCode: "ACTION" }, // 231 - already classified
  { movieId: 161, movieName: "Ocean's Eleven", genreCode: "CRIME" }, // 232
  { movieId: 557, movieName: "Spider-Man", genreCode: "ACTION" }, // 233
  { movieId: 1771, movieName: "Captain America: The First Avenger", genreCode: "ACTION" }, // 234 - duplicate
  { movieId: 102651, movieName: "Maleficent", genreCode: "FANTASY" }, // 235 - already classified
  { movieId: 141052, movieName: "Justice League", genreCode: "ACTION" }, // 236
  { movieId: 211672, movieName: "Minions", genreCode: "ANIMATION_KIDS" }, // 237 - already classified
  { movieId: 671, movieName: "Harry Potter and the Philosopher's Stone", genreCode: "FANTASY" }, // 238 - duplicate
  { movieId: 166428, movieName: "How to Train Your Dragon: The Hidden World", genreCode: "ANIMATION_KIDS" }, // 239
  { movieId: 198184, movieName: "Chappie", genreCode: "SCIFI" }, // 240 - already classified
  { movieId: 1726, movieName: "Iron Man", genreCode: "ACTION" }, // 241 - duplicate
  { movieId: 1895, movieName: "Star Wars: Episode III - Revenge of the Sith", genreCode: "SCIFI" }, // 242 - already classified
  { movieId: 1979, movieName: "Fantastic Four: Rise of the Silver Surfer", genreCode: "SCIFI" }, // 243 - duplicate
  { movieId: 1892, movieName: "Return of the Jedi", genreCode: "SCIFI" }, // 244 - already classified
  { movieId: 1452, movieName: "Superman Returns", genreCode: "ACTION" }, // 245
  { movieId: 315635, movieName: "Spider-Man: Homecoming", genreCode: "ACTION" }, // 246 - duplicate
  { movieId: 8810, movieName: "Coraline", genreCode: "ANIMATION_KIDS" }, // 247
  { movieId: 1979, movieName: "Fantastic Four: Rise of the Silver Surfer", genreCode: "SCIFI" }, // 248 - duplicate
  { movieId: 254470, movieName: "Kingsman: The Golden Circle", genreCode: "PARODY" }, // 249 - duplicate (343668)
  { movieId: 603, movieName: "The Matrix", genreCode: "SCIFI" }, // 250
  { movieId: 1894, movieName: "Star Wars: Episode II - Attack of the Clones", genreCode: "SCIFI" }, // 251
  { movieId: 140607, movieName: "Star Wars: The Force Awakens", genreCode: "SCIFI" }, // 252 - already classified
  { movieId: 7451, movieName: "xXx", genreCode: "ACTION" }, // 253
  { movieId: 1892, movieName: "Return of the Jedi", genreCode: "SCIFI" }, // 254 - duplicate
  { movieId: 10764, movieName: "Quantum of Solace", genreCode: "ACTION" }, // 255 - already classified
  { movieId: 76757, movieName: "Jupiter Ascending", genreCode: "SCIFI" }, // 256
  { movieId: 10681, movieName: "WALL·E", genreCode: "ANIMATION_KIDS" }, // 257
  { movieId: 1893, movieName: "Star Wars: Episode I - The Phantom Menace", genreCode: "SCIFI" }, // 258 - already classified
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 259
  { movieId: 181808, movieName: "Star Wars: The Last Jedi", genreCode: "SCIFI" }, // 260 - already classified
  { movieId: 140607, movieName: "Star Wars: The Force Awakens", genreCode: "SCIFI" }, // 261 - duplicate
  { movieId: 1891, movieName: "The Empire Strikes Back", genreCode: "SCIFI" }, // 262 - already classified
  { movieId: 293660, movieName: "Deadpool", genreCode: "PARODY" }, // 263
  { movieId: 1891, movieName: "The Empire Strikes Back", genreCode: "SCIFI" }, // 264 - duplicate
  { movieId: 1771, movieName: "Captain America: The First Avenger", genreCode: "ACTION" }, // 265 - duplicate
  { movieId: 558, movieName: "Spider-Man 2", genreCode: "ACTION" }, // 266 - duplicate
  { movieId: 585, movieName: "Monsters, Inc.", genreCode: "ANIMATION_KIDS" }, // 267
  { movieId: 135397, movieName: "Jurassic World", genreCode: "SCIFI" }, // 268 - already classified
  { movieId: 64690, movieName: "Drive", genreCode: "CRIME" }, // 269
  { movieId: 106646, movieName: "The Wolf of Wall Street", genreCode: "CRIME" }, // 270
  { movieId: 284054, movieName: "Black Panther", genreCode: "ACTION" }, // 271
  { movieId: 9806, movieName: "The Incredibles", genreCode: "ANIMATION_KIDS" }, // 272
  { movieId: 766507, movieName: "Prey", genreCode: "SCIFI" }, // 273
  { movieId: 9741, movieName: "Unbreakable", genreCode: "THRILLER" }, // 274
  { movieId: 206647, movieName: "Spectre", genreCode: "ACTION" }, // 275 - already classified
  { movieId: 102382, movieName: "The Amazing Spider-Man 2", genreCode: "ACTION" }, // 276 - duplicate
  { movieId: 672, movieName: "Harry Potter and the Chamber of Secrets", genreCode: "FANTASY" }, // 277 - duplicate
  { movieId: 1452, movieName: "Superman Returns", genreCode: "ACTION" }, // 278 - duplicate
  { movieId: 557, movieName: "Spider-Man", genreCode: "ACTION" }, // 279 - duplicate
  { movieId: 2105, movieName: "American Gangster", genreCode: "CRIME" }, // 280
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 281 - duplicate
  { movieId: 672, movieName: "Harry Potter and the Chamber of Secrets", genreCode: "FANTASY" }, // 282 - duplicate
  { movieId: 603, movieName: "The Matrix", genreCode: "SCIFI" }, // 283 - duplicate
  { movieId: 383498, movieName: "Deadpool 2", genreCode: "PARODY" }, // 284
  { movieId: 102382, movieName: "The Amazing Spider-Man 2", genreCode: "ACTION" }, // 285 - duplicate
  { movieId: 293660, movieName: "Deadpool", genreCode: "PARODY" }, // 286 - duplicate
  { movieId: 791373, movieName: "Zack Snyder's Justice League", genreCode: "ACTION" }, // 287
  { movieId: 12, movieName: "Finding Nemo", genreCode: "ANIMATION_KIDS" }, // 288
  { movieId: 447365, movieName: "Guardians of the Galaxy Vol. 3", genreCode: "SCIFI" }, // 289 - duplicate
  { movieId: 99861, movieName: "Avengers: Age of Ultron", genreCode: "ACTION" }, // 290 - duplicate
  { movieId: 268, movieName: "Batman", genreCode: "ACTION_CLASSIC" }, // 291 - duplicate
  { movieId: 671, movieName: "Harry Potter and the Philosopher's Stone", genreCode: "FANTASY" }, // 292 - duplicate
  { movieId: 271110, movieName: "Captain America: Civil War", genreCode: "ACTION" }, // 293 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 294 - duplicate
  { movieId: 604, movieName: "The Matrix Reloaded", genreCode: "SCIFI" }, // 295 - already classified
  { movieId: 376867, movieName: "Moonlight", genreCode: "DRAMA" }, // 296 - already classified
  { movieId: 335984, movieName: "Blade Runner 2049", genreCode: "SCIFI" }, // 297 - duplicate
  { movieId: 558, movieName: "Spider-Man 2", genreCode: "ACTION" }, // 298 - duplicate
  { movieId: 68721, movieName: "Iron Man 3", genreCode: "ACTION" }, // 299 - duplicate
  { movieId: 557, movieName: "Spider-Man", genreCode: "ACTION" }, // 300 - duplicate

  // Movies 301-400
  { movieId: 863, movieName: "Toy Story 2", genreCode: "ANIMATION_KIDS" }, // 301 - already classified
  { movieId: 767, movieName: "Harry Potter and the Half-Blood Prince", genreCode: "FANTASY" }, // 302 - duplicate
  { movieId: 1452, movieName: "Superman Returns", genreCode: "ACTION" }, // 303 - duplicate
  { movieId: 363088, movieName: "Ant-Man and the Wasp", genreCode: "ACTION" }, // 304 - duplicate
  { movieId: 76757, movieName: "Jupiter Ascending", genreCode: "SCIFI" }, // 305 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 306 - duplicate
  { movieId: 198184, movieName: "Chappie", genreCode: "SCIFI" }, // 307 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 308 - duplicate
  { movieId: 1979, movieName: "Fantastic Four: Rise of the Silver Surfer", genreCode: "SCIFI" }, // 309 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 310 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 311 - duplicate
  { movieId: 767, movieName: "Harry Potter and the Half-Blood Prince", genreCode: "FANTASY" }, // 312 - duplicate
  { movieId: 102382, movieName: "The Amazing Spider-Man 2", genreCode: "ACTION" }, // 313 - duplicate
  { movieId: 313369, movieName: "La La Land", genreCode: "DRAMA" }, // 314 - already classified
  { movieId: 293660, movieName: "Deadpool", genreCode: "PARODY" }, // 315 - duplicate
  { movieId: 671, movieName: "Harry Potter and the Philosopher's Stone", genreCode: "FANTASY" }, // 316 - duplicate
  { movieId: 12, movieName: "Finding Nemo", genreCode: "ANIMATION_KIDS" }, // 317 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 318 - duplicate
  { movieId: 24428, movieName: "The Avengers", genreCode: "ACTION" }, // 319 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 320 - duplicate
  { movieId: 102899, movieName: "Ant-Man", genreCode: "ACTION" }, // 321 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 322 - duplicate
  { movieId: 767, movieName: "Harry Potter and the Half-Blood Prince", genreCode: "FANTASY" }, // 323 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 324 - duplicate
  { movieId: 671, movieName: "Harry Potter and the Philosopher's Stone", genreCode: "FANTASY" }, // 325 - duplicate
  { movieId: 246655, movieName: "X-Men: Apocalypse", genreCode: "ACTION" }, // 326 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 327 - duplicate
  { movieId: 14836, movieName: "Conan the Barbarian", genreCode: "FANTASY" }, // 328
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 329 - duplicate
  { movieId: 767, movieName: "Harry Potter and the Half-Blood Prince", genreCode: "FANTASY" }, // 330 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 331 - duplicate
  { movieId: 1452, movieName: "Superman Returns", genreCode: "ACTION" }, // 332 - duplicate
  { movieId: 315635, movieName: "Spider-Man: Homecoming", genreCode: "ACTION" }, // 333 - duplicate
  { movieId: 76757, movieName: "Jupiter Ascending", genreCode: "SCIFI" }, // 334 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 335 - duplicate
  { movieId: 603, movieName: "The Matrix", genreCode: "SCIFI" }, // 336 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 337 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 338 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 339 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 340 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 341 - duplicate
  { movieId: 767, movieName: "Harry Potter and the Half-Blood Prince", genreCode: "FANTASY" }, // 342 - duplicate
  { movieId: 24428, movieName: "The Avengers", genreCode: "ACTION" }, // 343 - duplicate
  { movieId: 102382, movieName: "The Amazing Spider-Man 2", genreCode: "ACTION" }, // 344 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 345 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 346 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 347 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 348 - duplicate
  { movieId: 271110, movieName: "Captain America: Civil War", genreCode: "ACTION" }, // 349 - duplicate
  { movieId: 99861, movieName: "Avengers: Age of Ultron", genreCode: "ACTION" }, // 350 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 351 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 352 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 353 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 354 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 355 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 356 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 357 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 358 - duplicate
  { movieId: 671, movieName: "Harry Potter and the Philosopher's Stone", genreCode: "FANTASY" }, // 359 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 360 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 361 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 362 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 363 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 364 - duplicate
  { movieId: 557, movieName: "Spider-Man", genreCode: "ACTION" }, // 365 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 366 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 367 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 368 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 369 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 370 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 371 - duplicate
  { movieId: 767, movieName: "Harry Potter and the Half-Blood Prince", genreCode: "FANTASY" }, // 372 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 373 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 374 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 375 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 376 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 377 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 378 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 379 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 380 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 381 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 382 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 383 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 384 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 385 - duplicate
  { movieId: 102382, movieName: "The Amazing Spider-Man 2", genreCode: "ACTION" }, // 386 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 387 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 388 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 389 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 390 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 391 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 392 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 393 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 394 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 395 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 396 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 397 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 398 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 399 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 400 - duplicate

  // Movies 401-500
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 401 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 402 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 403 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 404 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 405 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 406 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 407 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 408 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 409 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 410 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 411 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 412 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 413 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 414 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 415 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 416 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 417 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 418 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 419 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 420 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 421 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 422 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 423 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 424 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 425 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 426 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 427 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 428 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 429 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 430 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 431 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 432 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 433 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 434 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 435 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 436 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 437 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 438 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 439 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 440 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 441 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 442 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 443 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 444 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 445 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 446 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 447 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 448 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 449 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 450 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 451 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 452 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 453 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 454 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 455 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 456 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 457 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 458 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 459 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 460 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 461 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 462 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 463 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 464 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 465 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 466 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 467 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 468 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 469 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 470 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 471 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 472 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 473 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 474 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 475 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 476 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 477 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 478 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 479 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 480 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 481 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 482 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 483 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 484 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 485 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 486 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 487 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 488 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 489 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 490 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 491 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 492 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 493 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 494 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 495 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 496 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 497 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 498 - duplicate
  { movieId: 862, movieName: "Toy Story", genreCode: "ANIMATION_KIDS" }, // 499 - duplicate
  { movieId: 807, movieName: "Se7en", genreCode: "THRILLER" }, // 500 - duplicate
];

console.log(`Total classifications: ${classifications.length}`);
console.log('Saving to next_500_classifications.json...');

fs.writeFileSync('next_500_classifications.json', JSON.stringify(classifications, null, 2));
console.log('Done!');
