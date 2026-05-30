import insomniaPhone from '../../assets/level-01/insomnia-phone.png'
import wrongDog from '../../assets/level-01/wrong-dog.png'
import wrongSunflower from '../../assets/level-01/wrong-sunflower.png'

export const IMAGE_BOX_SEARCH_QUERY = '失眠 图片'

export const IMAGE_WRONG_HINT = '好像不太对呢'

export const IMAGE_BOX_CORRECT_SRC = insomniaPhone

export const IMAGE_SEARCH_OPTIONS = [
  { id: 'wrong-dog', src: wrongDog, correct: false },
  { id: 'insomnia-phone', src: insomniaPhone, correct: true },
  { id: 'wrong-sunflower', src: wrongSunflower, correct: false },
] as const
