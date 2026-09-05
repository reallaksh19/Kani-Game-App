import csv
import random
import sys

OUTPUT_FILE = 'public/MATH_GOOGLE_SHEET_DATA.csv'

def get_distractors(correct_val, generator_func, count=3, max_attempts=50):
    options = {correct_val}
    attempts = 0
    while len(options) < count + 1 and attempts < max_attempts:
        val = generator_func()
        if val != correct_val:
            options.add(val)
        attempts += 1

    # If we couldn't find enough unique distractors, fill with anything reasonable or duplicates if really stuck
    result = list(options)
    while len(result) < count + 1:
         result.append(generator_func()) # Just append even if duplicate to break loop

    random.shuffle(result)
    return result

def generate_fraction_questions():
    print("Generating fraction questions...")
    questions = []

    # 1. Identify
    for _ in range(15):
        den = random.choice([2, 3, 4, 5, 6, 8, 10])
        num = random.randint(1, den - 1)
        correct = f"{num}/{den}"

        def gen_fraction():
            d = random.choice([2, 3, 4, 5, 6, 8, 10])
            n = random.randint(1, d - 1)
            return f"{n}/{d}"

        opt_list = get_distractors(correct, gen_fraction)

        questions.append({
            'game_type': 'fraction-frenzy',
            'operation': 'identify',
            'num1': str(num),
            'num2': str(den),
            'answer': correct,
            'option1': opt_list[0],
            'option2': opt_list[1],
            'option3': opt_list[2],
            'option4': opt_list[3],
            'difficulty': 'Easy',
            'hint': f'Count the shaded parts (top) and total parts (bottom).',
            'know_more': f'The top number (numerator) counts shaded parts. The bottom number (denominator) counts total parts.',
            'image_url': f'dynamic:fraction:{num}:{den}'
        })

    # 2. Compare
    for _ in range(15):
        den1 = random.choice([2, 3, 4, 6, 8])
        num1 = random.randint(1, den1 - 1)
        den2 = random.choice([2, 3, 4, 6, 8])
        num2 = random.randint(1, den2 - 1)

        val1 = num1 / den1
        val2 = num2 / den2

        if val1 == val2: answer = "="; hint = "Equal!"
        elif val1 > val2: answer = ">"; hint = "Left is bigger"
        else: answer = "<"; hint = "Right is bigger"

        questions.append({
            'game_type': 'fraction-frenzy',
            'operation': 'compare',
            'num1': f"{num1}/{den1}",
            'num2': f"{num2}/{den2}",
            'answer': answer,
            'option1': '>',
            'option2': '<',
            'option3': '=',
            'option4': '?',
            'difficulty': 'Medium',
            'hint': hint,
            'know_more': 'Compare shaded areas.',
            'image_url': f'dynamic:compare:{num1}:{den1}:{num2}:{den2}'
        })

    # 3. Fill Blank
    equivalents = [
        (1,2, 2,4), (1,2, 3,6), (1,2, 4,8), (1,2, 5,10),
        (1,3, 2,6), (1,3, 3,9),
        (2,3, 4,6), (2,3, 6,9),
        (1,4, 2,8), (3,4, 6,8),
        (1,5, 2,10), (2,5, 4,10)
    ]

    for n1, d1, n2, d2 in equivalents:
        questions.append({
            'game_type': 'fraction-frenzy',
            'operation': 'fill-blank',
            'num1': f"{n1}/{d1}",
            'num2': f"?/{d2}",
            'answer': str(n2),
            'option1': str(n2),
            'option2': str(n2 + 1),
            'option3': str(n2 - 1 if n2 > 1 else n2 + 2),
            'option4': str(d2),
            'difficulty': 'Hard',
            'hint': f'Equivalent fractions.',
            'know_more': f'{n1}/{d1} is the same as {n2}/{d2}.',
            'image_url': f'dynamic:fraction:{n1}:{d1}'
        })

    # 4. Add
    for _ in range(10):
        den = random.choice([3, 4, 5, 6, 8, 10])
        n1 = random.randint(1, den - 2)
        n2 = random.randint(1, den - n1)
        ans = f"{n1+n2}/{den}"

        def gen_add_distractor():
            return f"{random.randint(1, den)}/{den}"

        opt_list = get_distractors(ans, gen_add_distractor)

        questions.append({
            'game_type': 'fraction-frenzy',
            'operation': 'add',
            'num1': f"{n1}/{den}",
            'num2': f"{n2}/{den}",
            'answer': ans,
            'option1': opt_list[0],
            'option2': opt_list[1],
            'option3': opt_list[2],
            'option4': opt_list[3],
            'difficulty': 'Medium',
            'hint': 'Add top numbers.',
            'know_more': 'Sum of parts.',
            'image_url': f'dynamic:add:{n1}:{den}:{n2}:{den}'
        })

    return questions

def generate_geometry_questions():
    print("Generating geometry questions...")
    questions = []

    shapes_2d = ['circle', 'triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'octagon', 'star', 'rhombus', 'trapezoid', 'oval', 'heart', 'arrow', 'cross', 'semicircle']

    for shape in shapes_2d:
        correct = shape.capitalize()
        def gen_shape(): return random.choice(shapes_2d).capitalize()
        opt_list = get_distractors(correct, gen_shape)

        questions.append({
            'game_type': 'geometry-galaxy',
            'operation': 'identify',
            'text1': shape,
            'answer': correct,
            'option1': opt_list[0],
            'option2': opt_list[1],
            'option3': opt_list[2],
            'option4': opt_list[3],
            'difficulty': 'Easy',
            'hint': 'Count sides/corners.',
            'know_more': f'{shape} shape.',
            'image_url': f'dynamic:shape:{shape}'
        })

    shapes_3d = ['cube', 'sphere']
    fake_3d = ['Cube', 'Sphere', 'Cone', 'Cylinder', 'Pyramid']
    for shape in shapes_3d:
        correct = shape.capitalize()
        def gen_3d(): return random.choice(fake_3d)
        opt_list = get_distractors(correct, gen_3d)

        questions.append({
            'game_type': 'geometry-galaxy',
            'operation': 'identify',
            'text1': shape,
            'answer': correct,
            'option1': opt_list[0],
            'option2': opt_list[1],
            'option3': opt_list[2],
            'option4': opt_list[3],
            'difficulty': 'Medium',
            'hint': '3D Object.',
            'know_more': f'{shape} is 3D.',
            'image_url': f'dynamic:shape:{shape}'
        })

    sides_map = {'triangle': 3, 'square': 4, 'rectangle': 4, 'pentagon': 5, 'hexagon': 6, 'octagon': 8}
    for shape, sides in sides_map.items():
        for _ in range(2):
            correct = str(sides)
            def gen_sides(): return str(random.randint(3, 10))
            opt_list = get_distractors(correct, gen_sides)

            questions.append({
                'game_type': 'geometry-galaxy',
                'operation': 'sides',
                'text1': shape,
                'answer': correct,
                'option1': opt_list[0],
                'option2': opt_list[1],
                'option3': opt_list[2],
                'option4': opt_list[3],
                'difficulty': 'Medium',
                'hint': 'Count lines.',
                'know_more': f'{sides} sides.',
                'image_url': f'dynamic:shape:{shape}'
            })

    return questions

def generate_money_questions():
    print("Generating money questions...")
    questions = []

    for _ in range(30):
        q = random.randint(0, 3)
        d = random.randint(0, 4)
        n = random.randint(0, 4)
        p = random.randint(0, 4)
        if q+d+n+p == 0: q = 1

        total = q*25 + d*10 + n*5 + p
        img_parts = []
        if q: img_parts.extend(['quarter', str(q)])
        if d: img_parts.extend(['dime', str(d)])
        if n: img_parts.extend(['nickel', str(n)])
        if p: img_parts.extend(['penny', str(p)])
        img_url = 'dynamic:coins:' + ':'.join(img_parts)

        correct = f"{total}¢"
        def gen_money_distractor():
            diff = random.choice([-10, -5, -1, 1, 5, 10])
            fake = total + diff
            return f"{fake}¢" if fake > 0 else f"{total+10}¢"

        opt_list = get_distractors(correct, gen_money_distractor)

        questions.append({
            'game_type': 'money-master',
            'operation': 'count',
            'num1': 'Count Coins',
            'answer': correct,
            'option1': opt_list[0],
            'option2': opt_list[1],
            'option3': opt_list[2],
            'option4': opt_list[3],
            'difficulty': 'Easy' if total < 50 else 'Medium',
            'hint': 'Sum the values.',
            'know_more': f'Total is {total}¢.',
            'image_url': img_url
        })

    for _ in range(20):
        price = random.choice([25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95])
        change = 100 - price
        questions.append({
            'game_type': 'money-master',
            'operation': 'change',
            'num1': f'Price: {price}¢',
            'num2': 'change',
            'text1': 'Paid: $1.00',
            'answer': f"{change}¢",
            'option1': f"{change}¢",
            'option2': f"{change + 5}¢",
            'option3': f"{change - 5}¢",
            'option4': f"{change + 10}¢",
            'difficulty': 'Hard',
            'hint': f'100 - {price}',
            'know_more': f'Change is {change}¢.',
            'image_url': ''
        })

    return questions

def main():
    print(f"Reading {OUTPUT_FILE}...")
    try:
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            if 'image_url' not in fieldnames:
                fieldnames.append('image_url')
            existing_data = list(reader)
    except FileNotFoundError:
        print("File not found, creating new.")
        existing_data = []
        fieldnames = ['game_type','num1','num2','operation','answer','option1','option2','option3','option4','difficulty','hint','know_more','image_url','text1','text2','topic','subtopic']

    target_games = {'fraction-frenzy', 'geometry-galaxy', 'money-master'}
    kept_data = [row for row in existing_data if row.get('game_type') not in target_games]

    new_questions = []
    new_questions.extend(generate_fraction_questions())
    new_questions.extend(generate_geometry_questions())
    new_questions.extend(generate_money_questions())

    final_data = kept_data + new_questions

    # Ensure all fields exist
    all_fields = set(fieldnames)
    for q in new_questions:
        for k in q.keys():
            all_fields.add(k)

    final_fieldnames = list(all_fields)

    # Sort fieldnames to keep game_type first if possible, purely for readability
    if 'game_type' in final_fieldnames:
        final_fieldnames.remove('game_type')
        final_fieldnames.insert(0, 'game_type')

    print(f"Writing {len(final_data)} rows to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=final_fieldnames)
        writer.writeheader()
        for row in final_data:
            # Fill missing keys
            for field in final_fieldnames:
                if field not in row:
                    row[field] = ''
            writer.writerow(row)

    print("Done!")

if __name__ == "__main__":
    main()
