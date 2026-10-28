import { redirect } from 'next/navigation'

// Como no sistema real, a aplicação abre na lista de alunos.
export default function Inicio() {
  redirect('/alunos')
}
