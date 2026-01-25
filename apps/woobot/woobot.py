import random

lang = 'english'

def woobot():
    word = choose_main_word()
    last_vowel, last_vowel_index = find_last_vowel(word)

    global woobot_output
    woobot_output = ''

    punctuations = ['?', ',', '!', ':']

    while True:

        words_iteration = random.randrange(1,5)

        for _ in range(words_iteration):
            number_vowel = random.randrange(0,3)
            length_word = len(word)
            transformed_word = word[:length_word - last_vowel_index] + last_vowel * number_vowel + word[last_vowel_index:]
            if woobot_output == '':
                woobot_output += transformed_word.capitalize()
            else:
                woobot_output += ' ' + transformed_word

        punctuation = random.choice(punctuations)
        if (punctuation == ':'):
            punctuations.remove(':')


        match (punctuation):
            case '?':
                if (lang) == 'french':
                    woobot_output += ' ' + punctuation
                    print(woobot_output)
                    return woobot_output
                else:
                    woobot_output += punctuation
                    print(woobot_output)
                    return woobot_output
            case '!':
                if (lang) == 'french':
                    woobot_output += ' ' + punctuation
                    print(woobot_output)
                    return woobot_output
                else:
                    woobot_output += punctuation
                    print(woobot_output)
                    return woobot_output
            case '.':
                woobot_output += punctuation
                print(woobot_output)
                return woobot_output
            case ':':
                if (lang) == 'french':
                    woobot_output += ' ' + punctuation
                else:
                    woobot_output += punctuation
            case ',':
                woobot_output += punctuation





def choose_main_word():
    match (lang):
        case 'french':
            return 'ouaf'
        case 'english':
            return 'woof'
        case 'german':
            return 'wuff'
        case 'icelandic':
            return 'voff'
        case _:
            return 'woofiwoof'

def find_last_vowel(word):
    for i in range(len(word)-1, -1, -1):
        if is_vowel(word[i]):
            return word[i], i
    return None

def is_vowel(char):
    return char.lower() in 'aeiou'
