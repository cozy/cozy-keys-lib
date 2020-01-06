import React, { useState } from 'react'
import TextField from 'cozy-ui/transpiled/react/MuiCozyTheme/TextField'
import Button from 'cozy-ui/transpiled/react/Button'
import InputAdornment from '@material-ui/core/InputAdornment'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import omit from 'lodash/omit'

const DumbEyeAdornment = props => {
  const { hidden, t, ...rest } = omit(props, 'f')

  return (
    <InputAdornment position="end">
      <Button
        iconOnly
        icon={hidden ? 'eye' : 'eye-closed'}
        className="u-ph-half u-mh-0 u-miw-auto"
        type="button"
        label={hidden ? t('unlock.show') : t('unlock.hide')}
        {...rest}
      />
    </InputAdornment>
  )
}

const EyeAdornment = translate()(DumbEyeAdornment)

const PasswordField = props => {
  const [hidden, setHidden] = useState(true)

  return (
    <TextField
      {...props}
      variant="outlined"
      type={hidden ? 'password' : 'text'}
      InputProps={{
        endAdornment: (
          <EyeAdornment onClick={() => setHidden(!hidden)} hidden={hidden} />
        )
      }}
    />
  )
}

export default PasswordField
