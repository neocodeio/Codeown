import React, { useState, useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    onClose: () => void;
}

const EMOJI_DATA = [
    {
        category: "Smileys & people",
        emojis: [
            "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
            "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
            "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
            "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
            "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
            "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
            "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
            "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
            "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈",
            "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾",
            "🤖", "🎃", "😺", "😸", "😻", "😼", "😽", "🙀", "😿", "😾",
            "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
            "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍",
            "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝",
            "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👣",
            "👂", "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁️", "👅", "👄"
        ]
    },
    {
        category: "Animals & nature",
        emojis: [
            "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
            "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊",
            "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉",
            "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌",
            "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🕸️", "🦂",
            "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀"
        ]
    },
    {
        category: "Food & drink",
        emojis: [
            "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
            "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑",
            "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅",
            "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳",
            "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔"
        ]
    },
    {
        category: "Activities",
        emojis: [
            "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🪄",
            "🏓", "🏸", "🥅", "🏒", "👡", "⛳", "🪁", "🏹", "🎣", "🤿",
            "🥊", "🥋", "⛸️", "🎿", "🛷", "🥌", "🎯", "🪀", "🪁", "🎮",
            "🕹️", "🎰", "🎲", "🧩", "🧸", "🪅", "🪆", "🎨", "🖼️", "🧵"
        ]
    },
    {
        category: "Travel & places",
        emojis: [
            "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
            "🛻", "🚚", "🚛", "🚜", "🏎️", "🏍️", "🛵", "🦽", "🦼", "🛺",
            "🚲", "🛴", "🛹", "🛼", "⛽", "🚨", "✈️", "🛫", "🛬", "🛸",
            "🚁", "🛶", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", "🚧"
        ]
    },
    {
        category: "Objects",
        emojis: [
            "⌚", "📱", "📲", "💻", "⌨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽",
            "💾", "💿", "DVD", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️",
            "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭",
            "⏱️", "⏲️", "⏰", "⏳", "⌛", "📡", "🔋", "🔌", "💡", "🔦"
        ]
    },
    {
        category: "Symbols",
        emojis: [
            "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
            "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️",
            "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐",
            "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐"
        ]
    }
];

const EMOJI_KEYWORDS: Record<string, string> = {
    // Smileys
    "😀": "grinning face smile happy", "😃": "grinning face big eyes smile happy", "😄": "grinning face smiling eyes smile happy",
    "😁": "beaming face smiling eyes smile happy", "😆": "grinning squinting face smile happy", "😅": "grinning face sweat relief happy",
    "😂": "face with tears of joy laugh lol", "🤣": "rolling on the floor laughing rofl", "😊": "smiling face smiling eyes blush",
    "😇": "smiling face with halo angel", "🙂": "slight smile", "🙃": "upside down", "😉": "wink", "😌": "relieved",
    "😍": "heart eyes love", "🥰": "smiling face with hearts love", "😘": "kissing heart blow kiss", "😗": "kissing face",
    "😙": "kissing face smiling eyes", "😚": "kissing face closed eyes", "😋": "savoring food yum", "😛": "tongue out",
    "😝": "squinting tongue out", "😜": "winking tongue out", "🤪": "zany face crazy", "🤨": "raised eyebrow",
    "🧐": "monocle", "🤓": "nerd", "😎": "sunglasses cool", "🤩": "star struck", "🥳": "partying face celebrate",
    "😏": "smirk", "😒": "unamused", "😞": "disappointed", "😔": "pensive", "😟": "worried", "😕": "confused",
    "🙁": "slight frown", "☹️": "frown", "😣": "persevere", "😖": "confounded", "😫": "tired", "😩": "weary",
    "🥺": "pleading begging puppy eyes", "😢": "crying tear", "😭": "loudly crying sob", "😤": "triumph steam nostrils",
    "😠": "angry", "😡": "pouting rage", "🤬": "symbols on mouth swearing", "🤯": "exploding head mind blown",
    "😳": "flushed", "🥵": "hot heat", "🥶": "cold ice", "😱": "screaming fear", "😨": "fearful", "😰": "anxious sweat",
    "😥": "sad relieved", "😓": "downcast sweat", "🤗": "hugging", "🤔": "thinking", "🤭": "hand over mouth",
    "🤫": "shushing quiet", "🤥": "lying liar pinocchio", "😶": "no mouth", "😐": "neutral", "😑": "expressionless",
    "😬": "grimacing", "🙄": "rolling eyes", "😯": "hushed", "😦": "frowning open mouth", "😧": "anguished",
    "😮": "open mouth", "😲": "astonished", "🥱": "yawning", "😴": "sleeping", "🤤": "drooling", "😪": "sleepy",
    "😵": "dizzy", "🤐": "zipper mouth", "🥴": "woozy drunk", "🤢": "nauseated vomit", "🤮": "vomiting",
    "🤧": "sneezing", "😷": "mask", "🤒": "thermometer unwell", "🤕": "bandage", "🤑": "money mouth",
    "🤠": "cowboy", "😈": "smiling face with horns devil", "👿": "angry face with horns demon", "👹": "ogre",
    "👺": "goblin", "🤡": "clown", "💩": "poop shit", "👻": "ghost", "💀": "skull death", "☠️": "crossbones",
    "👽": "alien", "👾": "alien monster space", "🤖": "robot", "🎃": "pumpkin halloween",

    // Hands
    "👋": "wave", "🤚": "raised back", "🖐️": "five hand finger", "✋": "stop", "🖖": "vulcan", "👌": "ok",
    "🤌": "pinched fingers", "🤏": "pinching hand", "✌️": "v victory peace", "🤞": "fingers crossed",
    "🤟": "love you gesture", "🤘": "rock on", "🤙": "call me", "👈": "point left", "👉": "point right",
    "👆": "point up", "🖕": "middle finger", "👇": "point down", "☝️": "index finger", "👍": "thumbs up",
    "👎": "thumbs down", "✊": "fist", "👊": "oncoming fist punch", "🤛": "leftwards fist", "🤜": "rightwards fist",
    "👏": "clapping hands", "🙌": "raising hands", "👐": "open hands", "🤲": "palms up", "🤝": "handshake",
    "🙏": "pray thanks", "✍️": "writing", "💅": "nail polish", "🤳": "selfie", "💪": "biceps strong",

    // Hearts
    "❤️": "red heart love", "🧡": "orange heart", "💛": "yellow heart", "💚": "green heart", "💙": "blue heart",
    "💜": "purple heart", "🖤": "black heart", "🤍": "white heart", "🤎": "brown heart", "💔": "broken heart",

    // Animals
    "🐶": "dog puppy", "🐱": "cat kitten", "🐭": "mouse", "🐹": "hamster", "🐰": "rabbit bunny", "🦊": "fox",
    "🐻": "bear", "🐼": "panda", "🐯": "tiger", "🦁": "lion", "🐮": "cow", "🐷": "pig", "🐸": "frog",
    "🐵": "monkey", "🐔": "chicken", "🐧": "penguin", "🐦": "bird", "🐤": "chick", "🐥": "chick",
    "🦆": "duck", "🦅": "eagle", "🦉": "owl", "🦇": "bat", "🐺": "wolf", "🦋": "butterfly", "🐙": "octopus",
    "🐢": "turtle", "🐍": "snake", "🦖": "t-rex", "🦕": "sauropod",

    // Food
    "🍏": "apple", "🍎": "apple", "🍐": "pear", "🍊": "orange", "🍋": "lemon", "🍌": "banana", "🍉": "watermelon",
    "🍓": "strawberry", "🍅": "tomato", "🍆": "eggplant", "🥑": "avocado", "🌽": "corn", "🥕": "carrot",
    "🥐": "croissant", "🍞": "bread", "🍔": "burger", "🍟": "fries", "🍕": "pizza", "🌮": "taco", "🍜": "noodles",
    "🍱": "bento", "🍣": "sushi", "🍦": "ice cream", "🍩": "donut", "🍪": "cookie", "🍺": "beer", "🍷": "wine"
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
    const [search, setSearch] = useState('');

    const filteredData = useMemo(() => {
        if (!search) return EMOJI_DATA;
        const s = search.toLowerCase();
        return EMOJI_DATA.map(cat => ({
            ...cat,
            emojis: cat.emojis.filter(emoji => {
                const keywords = EMOJI_KEYWORDS[emoji] || "";
                return keywords.toLowerCase().includes(s) ||
                    cat.category.toLowerCase().includes(s) ||
                    emoji.includes(s);
            })
        })).filter(cat => cat.emojis.length > 0);
    }, [search]);

    const pickerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={pickerRef}
            style={{
                width: '340px',
                maxWidth: 'calc(100vw - 48px)',
                height: '400px',
                maxHeight: '40vh',
                backgroundColor: 'var(--bg-page)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                border: '1px solid var(--border-hairline)',
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-hairline)' }}>
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-hover)',
                    borderRadius: '20px',
                    padding: '0 12px'
                }}>
                    <HugeiconsIcon icon={Search01Icon} size={16} style={{ color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 8px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            outline: 'none',
                            fontSize: '14px',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
                {filteredData.map(cat => (
                    <div key={cat.category}>
                        <div style={{
                            padding: '12px 8px 8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            position: 'sticky',
                            top: 0,
                            backgroundColor: 'var(--bg-page)',
                            zIndex: 1
                        }}>
                            {cat.category}
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(8, 1fr)',
                            gap: '4px'
                        }}>
                            {cat.emojis.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => onEmojiSelect(emoji)}
                                    style={{
                                        fontSize: '22px',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        transition: 'background-color 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmojiPicker;
