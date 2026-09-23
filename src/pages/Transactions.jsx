import { useSearchParams } from 'react-router-dom'
import SidebarLayout from '../components/SidebarLayout'
import TransactionSearchPanel from '../components/TransactionSearchPanel'

export default function Transactions() {
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type')
  const initialType = type === 'in' || type === 'out' ? type : 'all'

  return (
    <SidebarLayout title="ค้นหา / แก้ไข / ลบ รายการเข้า-ออก (In/Out Records)">
      <TransactionSearchPanel key={initialType} initialType={initialType} tableMaxHeight="max-h-[70vh]" />
    </SidebarLayout>
  )
}
