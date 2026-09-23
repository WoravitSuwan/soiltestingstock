import Modal from './Modal'
import TransactionSearchPanel from './TransactionSearchPanel'

export default function TransactionSearchModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="ค้นหา / แก้ไข / ลบ รายการเข้า-ออก" wide>
      <TransactionSearchPanel onBeforeNavigate={onClose} tableMaxHeight="max-h-[55vh]" />
    </Modal>
  )
}
