import { Calendar, Eye, Heart, Clock, ArrowRight } from "lucide-react";
import { Post } from "../types";

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

export default function PostCard({ post, onClick }: PostCardProps) {
  // Format Date gracefully
  const formattedDate = new Date(post.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <article 
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-none border border-stone-200/80 bg-white transition-all duration-300 hover:border-stone-450 hover:bg-[#fafaf9]/30 cursor-pointer"
      id={`post-card-${post.id}`}
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 border-b border-stone-200/50">
        <span className="absolute top-3 left-3 z-10 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-stone-900 uppercase tracking-widest border border-stone-900 shadow-xs">
          {post.category}
        </span>
        <img
          src={post.coverImage}
          alt={post.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-102"
        />
      </div>

      {/* Content Details */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Date and Reading Time */}
        <div className="flex items-center space-x-4 text-[11px] font-medium text-stone-400 mb-3">
          <span className="flex items-center space-x-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{post.readingTime}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg font-bold leading-snug text-stone-950 group-hover:text-stone-700 transition-colors duration-200 mb-2.5 line-clamp-2">
          {post.title}
        </h3>

        {/* Description */}
        <p className="font-serif text-sm leading-relaxed text-stone-600 line-clamp-3 mb-5 flex-1">
          {post.summary}
        </p>

        {/* Footer Meta: Tags, Views, likes and Action Link */}
        <div className="border-t border-stone-100 pt-4 mt-auto">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx} 
                className="text-[10px] font-semibold text-stone-500 bg-stone-100 border border-stone-200/50 px-1.5 py-0.5"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center space-x-3.5 text-stone-400">
              <span className="flex items-center space-x-1" title="阅读量">
                <Eye className="h-3.5 w-3.5" />
                <span>{post.views}</span>
              </span>
              <span className="flex items-center space-x-1" title="喜欢数">
                <Heart className="h-3.5 w-3.5" />
                <span>{post.likes}</span>
              </span>
            </div>
            
            <span className="flex items-center space-x-1 text-stone-900 group-hover:translate-x-1 transition-transform duration-200">
              <span>阅读全文</span>
              <ArrowRight className="h-3.5 w-3.5 text-stone-900" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
