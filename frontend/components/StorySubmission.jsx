import React, { useState } from "react";
import { toast } from "sonner";

const StorySubmission = ({ room, socket, hasSubmitted, onStoriesSubmitted }) => {
  const [stories, setStories] = useState(["", "", ""]);
  const [isTruth, setIsTruth] = useState(null);

  const handleSubmitStories = () => {
    if (stories.some(story => !story.trim())) {
      toast.error("Please fill in all 3 stories");
      return;
    }
    if (isTruth === null) {
      toast.error("Please select which story is true");
      return;
    }
    
    socket.emit("submit-stories", { 
      roomId: room.id, 
      stories, 
      isTruth 
    });
    
    onStoriesSubmitted();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="text-3xl font-bold text-gray-800">Submit Your Stories</h2>
      <p className="text-gray-600 text-center max-w-2xl">
        Write 3 personal stories - 2 lies and 1 truth. Be creative and make them believable!
      </p>
      
      <div className="w-full max-w-2xl space-y-4">
        {stories.map((story, index) => (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Story {index + 1}:
            </label>
            <textarea
              value={story}
              onChange={(e) => {
                const newStories = [...stories];
                newStories[index] = e.target.value;
                setStories(newStories);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder={`Write your story ${index + 1} here...`}
              disabled={hasSubmitted}
            />
          </div>
        ))}
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Which story is TRUE? (Select one):
          </label>
          <div className="flex gap-4">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => setIsTruth(index)}
                disabled={hasSubmitted}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  isTruth === index
                    ? 'bg-green-500 text-white border-green-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Story {index + 1}
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={handleSubmitStories}
          disabled={hasSubmitted}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            hasSubmitted
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {hasSubmitted ? 'Stories Submitted!' : 'Submit Stories'}
        </button>
      </div>
    </div>
  );
};

export default StorySubmission; 