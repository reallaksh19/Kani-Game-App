import csv
import random

header = ["game_type", "option1", "text1", "answer", "know_more", "num1", "difficulty", "operation", "option2", "option4", "hint", "image_url", "num2", "option3"]

rows = []

# ==========================================
# Story Solver (50 questions)
# ==========================================

story_templates = [
    {
        "text": "Emma has {n1} stickers. She buys {n2} more. How many stickers does she have now?",
        "op": "+",
        "know_more": "Add the stickers she started with and the ones she bought!",
        "hint": "Think: {n1} plus {n2}"
    },
    {
        "text": "There are {n1} birds on a tree. {n2} fly away. How many birds are left?",
        "op": "-",
        "know_more": "Subtract the birds that flew away from the total.",
        "hint": "Think: {n1} minus {n2}"
    },
    {
        "text": "A box holds {n1} crayons. {n2} crayons are broken. How many are not broken?",
        "op": "-",
        "know_more": "Subtract the broken crayons from the total.",
        "hint": "Take away the broken ones."
    },
    {
        "text": "Leo reads {n1} pages on Monday and {n2} pages on Tuesday. How many pages did he read in total?",
        "op": "+",
        "know_more": "Add the pages from both days together.",
        "hint": "Combine Monday and Tuesday."
    },
    {
        "text": "There are {n1} cookies in a jar. Mom puts {n2} more cookies in. How many cookies are there now?",
        "op": "+",
        "know_more": "Add the new cookies to the ones already there.",
        "hint": "Add them up!"
    },
    {
        "text": "A classroom has {n1} chairs. {n2} chairs are empty. How many chairs are occupied?",
        "op": "-",
        "know_more": "Total chairs minus empty chairs equals occupied chairs.",
        "hint": "Subtract the empty ones."
    },
    {
        "text": "Sarah has {n1} apples. She wants to give one to each of her {n2} friends. Does she have enough?",
        "type": "compare",
        "know_more": "Compare the number of apples to the number of friends.",
        "hint": "Is {n1} bigger than {n2}?"
    },
    {
        "text": "Tom has {n1} toy cars. He arranges them in rows of {n2}. How many rows does he make?",
        "op": "/",
        "know_more": "Divide the total cars by the number in each row.",
        "hint": "Divide {n1} by {n2}"
    },
    {
        "text": "A garden has {n1} rows of flowers. Each row has {n2} flowers. How many flowers are there in total?",
        "op": "*",
        "know_more": "Multiply rows by flowers per row.",
        "hint": "{n1} groups of {n2}"
    }
]

for i in range(50):
    t = random.choice(story_templates)

    # Safe defaults
    n1, n2, ans, text = 0, 0, 0, ""
    opts = []

    if "type" in t and t["type"] == "compare":
        n1 = random.randint(5, 15)
        n2 = random.randint(5, 15)
        ans = "Yes" if n1 >= n2 else "No"
        opts = ["Yes", "No", "Maybe", "Don't Know"]
        text = t["text"].format(n1=n1, n2=n2)
    elif t.get("op") == "+":
        n1 = random.randint(5, 50)
        n2 = random.randint(5, 50)
        ans = n1 + n2
        text = t["text"].format(n1=n1, n2=n2)
    elif t.get("op") == "-":
        n1 = random.randint(20, 90)
        n2 = random.randint(1, n1)
        ans = n1 - n2
        text = t["text"].format(n1=n1, n2=n2)
    elif t.get("op") == "*":
        n1 = random.randint(2, 9)
        n2 = random.randint(2, 9)
        ans = n1 * n2
        text = t["text"].format(n1=n1, n2=n2)
    elif t.get("op") == "/":
        n2 = random.randint(2, 5)
        ans_val = random.randint(2, 10)
        n1 = n2 * ans_val
        ans = ans_val
        text = t["text"].format(n1=n1, n2=n2)

    if not opts:
        opts = [str(ans)]
        # Generate 3 fake answers
        seen = {str(ans)}
        tries = 0
        while len(opts) < 4 and tries < 50:
            tries += 1
            offset = random.randint(-5, 5)
            if offset == 0: continue
            fake = int(ans) + offset
            if fake > 0 and str(fake) not in seen:
                opts.append(str(fake))
                seen.add(str(fake))
        # Fill with random if still missing (fallback)
        while len(opts) < 4:
             opts.append(str(int(ans) + len(opts) + 10))

        random.shuffle(opts)
        ans = str(ans)

    rows.append({
        "game_type": "story-solver",
        "option1": opts[0], "option2": opts[1], "option3": opts[2], "option4": opts[3],
        "text1": text, "answer": ans, "know_more": t["know_more"],
        "num1": n1, "num2": n2, "difficulty": "Medium", "operation": "word_problem",
        "hint": t["hint"].format(n1=n1, n2=n2), "image_url": ""
    })

# ==========================================
# Estimation Express (50 questions)
# ==========================================

for i in range(50):
    op = random.choice(["+", "-", "*"])
    if op == "+":
        n1 = random.randint(11, 99)
        n2 = random.randint(11, 99)
        exact = n1 + n2
        target = round(exact / 10) * 10
        hint = f"Round {n1} -> {round(n1/10)*10} and {n2} -> {round(n2/10)*10}"
    elif op == "-":
        n1 = random.randint(50, 150)
        n2 = random.randint(10, 49)
        exact = n1 - n2
        target = round(exact / 10) * 10
        hint = f"Round {n1} -> {round(n1/10)*10} and {n2} -> {round(n2/10)*10}"
    elif op == "*":
        n1 = random.randint(11, 25)
        n2 = random.randint(2, 5)
        exact = n1 * n2
        target = round(exact / 10) * 10
        hint = f"Close to {round(n1/10)*10} x {n2}"

    opts = [str(target)]
    seen = {str(target)}
    offsets = [-10, -20, 10, 20, 30, -30]
    random.shuffle(offsets)
    for off in offsets:
        if len(opts) >= 4: break
        fake = target + off
        if fake > 0 and str(fake) not in seen:
            opts.append(str(fake))
            seen.add(str(fake))

    while len(opts) < 4:
         opts.append(str(target + len(opts)*10 + 50))

    random.shuffle(opts)

    rows.append({
        "game_type": "estimation-express",
        "option1": opts[0], "option2": opts[1], "option3": opts[2], "option4": opts[3],
        "text1": "", "answer": str(target), "know_more": "Estimation helps checking answers!",
        "num1": n1, "num2": n2, "difficulty": "Medium", "operation": op,
        "hint": hint, "image_url": ""
    })

# ==========================================
# Pattern Planet (50 questions)
# ==========================================

for i in range(50):
    pattern_type = random.choice(["add", "color", "shape", "mult"])

    if pattern_type == "add":
        start = random.randint(1, 20)
        step = random.randint(2, 5)
        seq = [start + x*step for x in range(5)]
        text1 = f"{seq[0]} {seq[1]} {seq[2]} {seq[3]} ?"
        ans = str(seq[4])
        hint = f"Add {step} each time"
        opts = [ans]
        seen = {ans}
        for k in range(1, 10):
            if len(opts) >= 4: break
            fake = str(int(ans) + random.choice([-1, 1]) * k)
            if fake not in seen:
                opts.append(fake)
                seen.add(fake)

    elif pattern_type == "mult":
        start = random.randint(1, 3)
        mult = 2
        seq = [start * (mult**x) for x in range(5)]
        text1 = f"{seq[0]} {seq[1]} {seq[2]} {seq[3]} ?"
        ans = str(seq[4])
        hint = "Double the number each time"
        opts = [ans]
        seen = {ans}
        for k in range(1, 10):
            if len(opts) >= 4: break
            fake = str(int(ans) + random.choice([-1, 1]) * k * 2)
            if fake not in seen:
                opts.append(fake)
                seen.add(fake)

    elif pattern_type == "color":
        colors = ["🔴", "🔵", "🟢", "🟡", "🟣"]
        c1 = random.choice(colors)
        c2 = random.choice(colors)
        while c1 == c2: c2 = random.choice(colors)
        text1 = f"{c1} {c2} {c1} {c2} ?"
        ans = c1
        hint = "Alternating colors"
        opts = [c1, c2]
        others = [c for c in colors if c not in opts]
        opts.extend(random.sample(others, min(2, len(others))))
        while len(opts) < 4: opts.append(random.choice(colors)) # unlikely to need

    elif pattern_type == "shape":
        shapes = ["⭐", "🌙", "☀️", "☁️", "⚡"]
        s1 = random.choice(shapes)
        s2 = random.choice(shapes)
        s3 = random.choice(shapes)
        text1 = f"{s1} {s2} {s3} {s1} ?"
        ans = s2
        hint = "Repeats every 3 items"
        opts = [s1, s2, s3]
        others = [s for s in shapes if s not in opts]
        if others: opts.append(random.choice(others))
        else: opts.append("❓") # fallback
        # dedupe
        opts = list(set(opts))
        while len(opts) < 4:
            opts.append(random.choice(shapes))
            opts = list(set(opts))
            if len(opts) < 4 and len(opts) == len(shapes): break # Max shapes reached

    random.shuffle(opts)

    rows.append({
        "game_type": "pattern-planet",
        "option1": opts[0], "option2": opts[1], "option3": opts[2], "option4": opts[3],
        "text1": text1, "answer": ans, "know_more": "Patterns follow a rule!",
        "num1": "", "num2": "", "difficulty": "Easy", "operation": "",
        "hint": hint, "image_url": ""
    })

# ==========================================
# Measurement Mission (50 questions)
# ==========================================

for i in range(50):
    m_type = random.choice(["length", "weight", "time", "capacity"])

    if m_type == "length":
        cm = random.choice([100, 200, 500, 1000, 150, 250])
        text1 = f"How many meters in {cm} centimeters?"
        ans = str(cm / 100).replace(".0", "")
        hint = "100 cm = 1 m"
        opts = [ans, str(cm/10).replace(".0",""), str(cm*10), str(cm/2).replace(".0","")]

    elif m_type == "weight":
        kg = random.randint(1, 5)
        text1 = f"How many grams in {kg} kilograms?"
        ans = str(kg * 1000)
        hint = "1 kg = 1000 g"
        opts = [ans, str(kg*100), str(kg*10), str(kg*500)]

    elif m_type == "time":
        mins = random.choice([60, 120, 180, 30])
        if mins < 60:
            text1 = f"Is {mins} minutes more than an hour?"
            ans = "No"
            opts = ["Yes", "No", "Equal", "Maybe"]
            hint = "60 minutes = 1 hour"
        else:
            text1 = f"How many hours is {mins} minutes?"
            ans = str(mins // 60)
            hint = "60 minutes = 1 hour"
            opts = [ans, str(mins//30), str(mins//10), str(mins//15)]

    elif m_type == "capacity":
        liters = random.randint(2, 5)
        text1 = f"How many 500ml bottles fill a {liters} liter jug?"
        ans = str(liters * 2)
        hint = "1 Liter = 2 x 500ml"
        opts = [ans, str(liters), str(liters*4), str(liters+2)]

    random.shuffle(opts)

    rows.append({
        "game_type": "measurement-mission",
        "option1": opts[0], "option2": opts[1], "option3": opts[2], "option4": opts[3],
        "text1": text1, "answer": ans, "know_more": "Measure carefully!",
        "num1": "", "num2": "", "difficulty": "Medium", "operation": m_type,
        "hint": hint, "image_url": ""
    })

# Write to file
output_rows = []
for r in rows:
    line = [
        r["game_type"], r["option1"], r["text1"], r["answer"], r["know_more"], str(r["num1"]),
        r["difficulty"], r["operation"], r["option2"], r["option4"], r["hint"], r["image_url"], str(r["num2"]), r["option3"]
    ]
    escaped_line = []
    for field in line:
        s = str(field)
        if "," in s or '"' in s:
            s = '"' + s.replace('"', '""') + '"'
        escaped_line.append(s)
    output_rows.append(",".join(escaped_line))

with open("public/MATH_GOOGLE_SHEET_DATA.csv", "a") as f:
    f.write("\n")
    f.write("\n".join(output_rows))

print(f"Appended {len(output_rows)} rows.")
