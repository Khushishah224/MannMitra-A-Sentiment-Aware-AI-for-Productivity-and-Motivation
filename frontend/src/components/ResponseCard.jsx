import React from 'react';

const ResponseCard = ({ type, content, mood }) => {
  // Map mood to color for the card header
  const moodColors = {
    happy: 'bg-yellow-100 border-yellow-300',
    content: 'bg-green-100 border-green-300',
    neutral: 'bg-blue-100 border-blue-300',
    tired: 'bg-purple-100 border-purple-300',
    lazy: 'bg-orange-100 border-orange-300',
    stressed: 'bg-red-100 border-red-300',
    sad: 'bg-indigo-100 border-indigo-300',
    very_sad: 'bg-gray-100 border-gray-300',
    angry: 'bg-rose-100 border-rose-300',
    default: 'bg-pink-100 border-pink-300'
  };

  // Map mood to emoji
  const moodEmojis = {
    happy: '😊',
    content: '😌',
    neutral: '😐',
    tired: '😴',
    lazy: '🦥',
    stressed: '😰',
    sad: '😢',
    very_sad: '😭',
    angry: '😠',
    default: '🌸'
  };

  const cardColor = moodColors[mood] || moodColors.default;
  const emoji = moodEmojis[mood] || moodEmojis.default;

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${cardColor} transition-all hover:shadow-lg`}>
      <div className={`px-4 py-2 flex items-center justify-between ${type === 'plan' ? 'bg-pink-50' : 'bg-white'}`}>
        <span className="font-medium text-gray-800 flex items-center gap-2">
          {emoji} {type === 'quote' ? 'Motivation' : 'Micro-Plan'}
        </span>
      </div>
      <div className="p-4">
        <div className="whitespace-pre-wrap text-gray-700">{content}</div>
      </div>
    </div>
  );
};

export default ResponseCard;
