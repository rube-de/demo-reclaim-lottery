import { FC, PropsWithChildren, ReactElement } from 'react';
import { StringUtils } from '../../utils/string.utils'; // Assuming StringUtils is available
import { CheckIcon } from '../icons/CheckIcon'; // Reusing CheckIcon for success/info
import { CancelIcon } from '../icons/CancelIcon'; // Reusing CancelIcon for error
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

const typeIcons: Record<StatusBannerType, ReactElement> = {
  // Using CheckIcon for both success and info for simplicity, adjust if needed
  success: <CheckIcon className={classes.icon} />,
  info: <CheckIcon className={classes.icon} />,
  error: <CancelIcon className={classes.icon} />,
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
