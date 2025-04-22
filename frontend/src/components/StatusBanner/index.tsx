import { FC, PropsWithChildren, ReactElement } from 'react';
import { StringUtils } from '../../utils/string.utils';
import { MaterialSymbol } from 'react-material-symbols';
import 'react-material-symbols/rounded'; // Import the rounded style for Material Symbols
import classes from './index.module.css';

type StatusBannerType = 'success' | 'info' | 'error';

interface Props extends PropsWithChildren {
  type: StatusBannerType;
  className?: string;
}

const typeStyles: Record<StatusBannerType, string> = {
  success: classes.bannerSuccess,
  info: classes.bannerInfo,
  error: classes.bannerError,
};

// Map banner types to corresponding Material Symbols icons
const typeIcons: Record<StatusBannerType, ReactElement> = {
  success: <MaterialSymbol icon="check_circle" size={24} grade={200} className={classes.icon} />,
  info: <MaterialSymbol icon="info" size={24} grade={200} className={classes.icon} />,
  error: <MaterialSymbol icon="cancel" size={24} grade={200} className={classes.icon} />,
};

export const StatusBanner: FC<Props> = ({
  type,
  children,
  className,
}) => {
  const bannerClass = typeStyles[type];
  const icon = typeIcons[type];

  return (
    <div className={StringUtils.clsx(classes.banner, bannerClass, className)}>
      {icon}
      <span>{children}</span>
    </div>
  );
};
