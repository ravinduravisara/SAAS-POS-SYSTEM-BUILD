const express = require('express')
const auth = require('../middlewares/authMiddleware')
const tenant = require('../middlewares/tenantMiddleware')
const {
	listBranches,
	createBranch,
	updateBranch,
	deleteBranch,
} = require('../controllers/branchController')

const router = express.Router()

router.use(auth, tenant)
router.get('/', listBranches)
router.post('/', createBranch)
router.put('/:id', updateBranch)
router.delete('/:id', deleteBranch)

module.exports = router

