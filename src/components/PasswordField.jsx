import React, { useState } from 'react'
import TextField from 'cozy-ui/transpiled/react/MuiCozyTheme/TextField'
import Button from 'cozy-ui/transpiled/react/Button'
import InputAdornment from '@material-ui/core/InputAdornment'

const EyeAdornment = ({ hidden, ...props }) => {
  return (
    <InputAdornment position="end">
      <Button
        iconOnly
        icon={hidden ? 'eye' : 'eye-closed'}
        className="u-ph-half u-mh-0 u-miw-auto"
        type="button"
        {...props}
      />
    </InputAdornment>
  )
}
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
