import { FC, PropsWithChildren, ReactElement } from 'react'
import classes from './index.module.css'
import { Card } from '../Card'
import { StringUtils } from '../../utils/string.utils'
import { MaterialSymbol } from 'react-material-symbols';
import 'react-material-symbols/rounded';


type AlertType = 'error' | 'success' | 'info'

interface AlertTypeValues {
  header: string
  icon: ReactElement
}

const ICON_SIZE = 106;
const ICON_GRADE = 200; // Controls weight and style, adjust as needed

const alertTypeValuesMap: Record<AlertType, AlertTypeValues> = {
  error: {
    header: 'Something went wrong',
    icon: <MaterialSymbol icon="cancel" size={ICON_SIZE} grade={ICON_GRADE} className={classes.cancelIcon} />,
  },
  success: {
    header: 'Success',
    icon: <MaterialSymbol icon="check_circle" size={ICON_SIZE} grade={ICON_GRADE} className={classes.checkIcon} />,
  },
  info: {
    header: 'Information', // Using 'warning' icon for visual cue
    icon: <MaterialSymbol icon="warning" size={ICON_SIZE} grade={ICON_GRADE} className={classes.infoIcon} />,
  },
}

const alertTypeClassMap: Record<AlertType, string> = {
  error: classes.alertError,
  success: classes.alertSuccess,
  info: classes.alertInfo,
}

interface Props extends PropsWithChildren {
  type: AlertType
  actions?: ReactElement
  headerText?: string
  className?: string
}

export const Alert: FC<Props> = ({ children, className, type, actions, headerText }) => {
  const { header, icon } = alertTypeValuesMap[type]

  return (
    <Card className={StringUtils.clsx(classes.card, className, alertTypeClassMap[type])}>
      <div className={classes.alert}>
        <h2>{headerText ?? header}</h2>
        <p className="body">{children}</p>
        <div className={classes.icon}>{icon}</div>
        <div className={classes.actions}>{actions}</div>
      </div>
    </Card>
  )
}
