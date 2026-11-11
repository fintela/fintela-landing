import { Avatar, Box, Typography } from '@mui/material';
import { blogAssetUrl } from './api';
import { palette, soft } from '../theme/tokens';

/** `Myrna Ortiz` → `MO`: first and last word, as on the share image's badge. */
const initials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const pick = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return pick.map((w) => [...w][0]?.toUpperCase() ?? '').join('');
};

const SIZES = {
  /** The cards: `/blog`, the home page's Insights band, related posts. */
  sm: { avatar: 32, gap: 1, variant: 'body2', weight: 600 },
  /** The post's header. */
  md: { avatar: 44, gap: 1.25, variant: 'body1', weight: 700 },
} as const;

interface AuthorBylineProps {
  author: string;
  /** `authorImage` from the post's JSON: the build's crop of the author's portrait. */
  image?: string;
  size?: keyof typeof SIZES;
  /** 'onImage': white name, for a card whose full background is the cover. */
  tone?: 'default' | 'onImage';
}

/**
 * The author's face, round, in front of their name — so a reader sees who
 * wrote the post, not only a name. The face is the build's black-and-white
 * crop of the author's portrait (see blog-preview.ts); an author without one,
 * or an image that fails to load, gets their initials on the brand's black.
 * The circle is decorative: the name beside it is what a screen reader reads.
 */
export const AuthorByline = ({ author, image, size = 'sm', tone = 'default' }: AuthorBylineProps) => {
  const s = SIZES[size];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: s.gap, minWidth: 0 }}>
      <Avatar
        aria-hidden
        alt=""
        src={image ? blogAssetUrl(image) : undefined}
        slotProps={{ img: { width: s.avatar, height: s.avatar, loading: 'lazy', decoding: 'async' } }}
        sx={{
          width: s.avatar,
          height: s.avatar,
          flexShrink: 0,
          bgcolor: palette.navy,
          color: soft.white,
          fontSize: s.avatar * 0.38,
          fontWeight: 700,
          letterSpacing: '0.02em',
          // A white ring and a soft drop, as around the share image's badge.
          boxShadow: `0 0 0 2px ${soft.white}, 0 1px 4px rgba(0, 0, 0, 0.22)`,
        }}
      >
        {initials(author)}
      </Avatar>
      <Typography variant={s.variant} sx={{ fontWeight: s.weight, color: tone === 'onImage' ? soft.white : soft.text, lineHeight: 1.3 }}>
        {author}
      </Typography>
    </Box>
  );
};
