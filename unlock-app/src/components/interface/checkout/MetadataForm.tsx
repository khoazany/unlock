import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import styled from 'styled-components'
import { MetadataInput, UserMetadata } from '../../../unlockTypes'
import { Button, LoadingButton, Input, Label } from './FormStyles'
import { formResultToMetadata } from '../../../utils/userMetadata'

interface Props {
  fields: MetadataInput[]
  onSubmit: (metadata: UserMetadata) => void
}

export const MetadataForm = ({ fields, onSubmit }: Props) => {
  // We can also destructure the `errors` field here and use it for
  // validation -- we'll have to consider how to handle the different
  // kinds of errors so that we can show the right message
  const { handleSubmit, register } = useForm()
  const [submittedForm, setSubmittedForm] = useState(false)

  // The form returns a map of key-value pair strings. We need to
  // process those into the expected metadata format so that the typed
  // data will be correct.
  const wrappedOnSubmit = (formResult: { [key: string]: string }) => {
    const metadata = formResultToMetadata(formResult, fields)
    setSubmittedForm(true)
    onSubmit(metadata)
  }

  return (
    <form onSubmit={handleSubmit(wrappedOnSubmit)}>
      <p>We need to collect some additional information for your purchase.</p>
      {fields.map(({ name, type, required }) => (
        <StyledLabel required={required} key={name}>
          <span>{name}</span>
          <Input type={type} name={name} ref={register({ required })} />
        </StyledLabel>
      ))}
      {submittedForm && (
        <LoadingButton type="button">Submitting Metadata...</LoadingButton>
      )}
      {!submittedForm && <Button type="submit">Continue</Button>}
    </form>
  )
}

export default MetadataForm

interface LabelProps {
  required: boolean
}

const StyledLabel = styled(Label)<LabelProps>`
  & > span:after {
    color: var(--red);
    content: ${(props: LabelProps) => (props.required ? '" *"' : '')};
  }
`
