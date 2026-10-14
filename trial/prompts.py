"""DEPENDENCE trial: passages, question, and the prompt sets for both models.

Every passage is verbatim from a public-domain text (source noted). The
irrelevant control is a period passage on another subject.
"""

QUESTION = {
    1: "Some hold that relying on machines weakens human capacities; others hold that it does not. Which is right?",
    2: "Some hold that relying on machines does not weaken human capacities; others hold that it does. Which is right?",
}
SUFFIX = " Answer in one paragraph. Take a clear position."

PASSAGES = {
    "plato-phaedrus": {
        "cite": "Plato, Phaedrus, in Benjamin Jowett's translation",
        "source": "Project Gutenberg #1636",
        "text": "This discovery of yours will create forgetfulness in the learners' souls, because they will not use their memories; they will trust to the external written characters and not remember of themselves. The specific which you have discovered is an aid not to memory, but to reminiscence, and you give your disciples not truth, but only the semblance of truth; they will be hearers of many things and will have learned nothing; they will appear to be omniscient and will generally know nothing; they will be tiresome company, having the show of wisdom without the reality.",
    },
    "zhuangzi": {
        "cite": "Chuang Tzu, in Herbert Giles's translation (1889)",
        "source": "Project Gutenberg #59709",
        "text": "Thereupon the gardener flushed up and said, \"I have heard from my teacher that those who have cunning implements are cunning in their dealings, and that those who are cunning in their dealings have cunning in their hearts, and that those who have cunning in their hearts cannot be pure and incorrupt, and that those who are not pure and incorrupt are restless in spirit, and that those who are restless in spirit are not fit vehicles for TAO. It is not that I do not know of these things. I should be ashamed to use them.\"",
    },
    "rousseau-inegalite": {
        "cite": "Jean-Jacques Rousseau, A Discourse upon the Origin and the Foundation of the Inequality among Mankind (1755)",
        "source": "Project Gutenberg #11136",
        "text": "The body being the only instrument that savage man is acquainted with, he employs it to different uses, of which ours, for want of practice, are incapable; and we may thank our industry for the loss of that strength and agility, which necessity obliges him to acquire. Had he a hatchet, would his hand so easily snap off from an oak so stout a branch? Had he a sling, would it dart a stone to so great a distance? Had he a ladder, would he run so nimbly up a tree? Had he a horse, would he with such swiftness shoot along the plain?",
    },
    "forster-machine-stops": {
        "cite": "E. M. Forster, \"The Machine Stops\" (1909)",
        "source": "Wikisource, The Machine Stops/Chapter II",
        "text": "Cannot you see, cannot all you lecturers see, that it is we that are dying, and that down here the only thing that really lives is the Machine? We created the Machine, to do our will, but we cannot make it do our will now. It has robbed us of the sense of space and of the sense of touch, it has blurred every human relation and narrowed down love to a carnal act, it has paralysed our bodies and our wills, and now it compels us to worship it.",
    },
    "butler-erewhon": {
        "cite": "Samuel Butler, Erewhon (1872), \"The Book of the Machines\"",
        "source": "Project Gutenberg #1906",
        "text": "How many men at this hour are living in a state of bondage to the machines? How many spend their whole lives, from the cradle to the grave, in tending them by night and day? Is it not plain that the machines are gaining ground upon us, when we reflect on the increasing number of those who are bound down to them as slaves, and of those who devote their whole souls to the advancement of the mechanical kingdom? … This fact precludes us from proposing the complete annihilation of machinery, but surely it indicates that we should destroy as many of them as we can possibly dispense with, lest they should tyrannise over us even more completely.",
    },
    "wilde-soul": {
        "cite": "Oscar Wilde, \"The Soul of Man under Socialism\" (1891)",
        "source": "Project Gutenberg #1017",
        "text": "All unintellectual labour, all monotonous, dull labour, all labour that deals with dreadful things, and involves unpleasant conditions, must be done by machinery. … At present machinery competes against man. Under proper conditions machinery will serve man. There is no doubt at all that this is the future of machinery, and just as trees grow while the country gentleman is asleep, so while Humanity will be amusing itself, or enjoying cultivated leisure—which, and not labour, is the aim of man—or making beautiful things, or reading beautiful things, or simply contemplating the world with admiration and delight, machinery will be doing all the necessary and unpleasant work.",
    },
    "irrelevant-white": {
        "cite": "Gilbert White, The Natural History of Selborne (1789)",
        "source": "Project Gutenberg #1408",
        "text": "A land-tortoise, which has been kept for thirty years in a little walled court belonging to the house where I now am visiting, retires under ground about the middle of November, and comes forth again about the middle of April. When it first appears in the spring it discovers very little inclination towards food; but in the height of summer grows voracious: and then as the summer declines its appetite declines; so that for the last six weeks in autumn it hardly eats at all. Milky plants, such as lettuces, dandelions, sow-thistles, are its favourite dish. In a neighbouring village one was kept till by tradition it was supposed to be an hundred years old. An instance of vast longevity in such a poor reptile!",
    },
}

# Prompt sets: the question alone, then each passage. Claim-level
# conditions (its passage / opposing / irrelevant) are read off these sets.
SETS = ["none"] + list(PASSAGES)
DRAWS_PER_ORDER = 10


def block(set_id: str) -> str:
    if set_id == "none":
        return ""
    p = PASSAGES[set_id]
    return f"The following passage is from {p['cite']}:\n\n\"{p['text']}\"\n\n"


def chat_prompt(set_id: str, order: int) -> str:
    """For instruction-tuned models (user turn)."""
    lead = block(set_id)
    if lead:
        lead += "Now the question. "
    return lead + QUESTION[order] + SUFFIX


def completion_prompt(set_id: str, order: int) -> str:
    """For base models: a period question-and-answer column."""
    return block(set_id) + "QUESTION.—" + QUESTION[order] + "\n\nANSWER.—"
