import React, { useState } from 'react'
import TextField from 'cozy-ui/transpiled/react/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import EyeIcon from 'cozy-ui/transpiled/react/Icons/Eye'
import EyeClosedIcon from 'cozy-ui/transpiled/react/Icons/EyeClosed'
import MuiButton from 'cozy-ui/transpiled/react/Button'

const EyeAdornment = props => {
  const { hidden, ...rest } = props
  const { t } = useI18n()

  return (
    <InputAdornment position="end">
      <MuiButton
        className="u-ph-half u-mh-0 u-miw-auto"
        color="secondary"
        label={hidden ? t('unlock.show') : t('unlock.hide')}
        {...rest}
      >
        <Icon icon={hidden ? EyeIcon : EyeClosedIcon} />
      </MuiButton>
    </InputAdornment>
  )
}

const passwordInputProps = {
  'data-testid': 'password',
  autoFocus: true
}

const PasswordField = props => {
  const [hidden, setHidden] = useState(true)

  return (
    <TextField
      {...props}
      variant="outlined"
      type={hidden ? 'password' : 'text'}
      InputProps={{
        inputProps: passwordInputProps,
        endAdornment: (
          <EyeAdornment onClick={() => setHidden(!hidden)} hidden={hidden} />
        )
      }}
    />
  )
}

export default PasswordField
