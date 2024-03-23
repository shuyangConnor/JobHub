import { GraphQLError } from 'graphql'
import { getCompany } from './db/companies.js'
import {
  countJobs,
  createJob,
  deleteJob,
  getJob,
  getJobs,
  getJobsByCompany,
  updateJob,
} from './db/jobs.js'

export const resolvers = {
  Query: {
    job: async (_root, { id }) => {
      const job = await getJob(id)
      if (!job) {
        throw notFoundError('No Job found with id ' + id)
      }
      return job
    },
    jobs: async (_root, { limit, offset }) => {
      const items = await getJobs(limit, offset)
      const totalCount = await countJobs()
      return { items, totalCount }
    },
    company: async (_root, { id }) => {
      const company = await getCompany(id)
      if (!company) {
        throw notFoundError('No Company found with id ' + id)
      }
      return company
    },
  },

  Mutation: {
    createJob: (_root, { input: { title, description } }, { user }) => {
      if (!user) throw unauthorizedError('Missing authentication')
      return createJob({ companyId: user.companyId, title, description })
    },
    deleteJob: async (_root, { id }, { user }) => {
      if (!user) throw unauthorizedError('Missing authentication')
      const job = await deleteJob(id, user.companyId)
      if (!job) throw unauthorizedError('No job found with id ' + id)
      return job
    },
    updateJob: async (
      _root,
      { input: { id, title, description } },
      { user }
    ) => {
      if (!user) throw unauthorizedError('Missing authentication')
      const job = await updateJob({
        id,
        title,
        description,
        companyId: user.companyId,
      })
      if (!job) throw unauthorizedError('No job found with id ' + id)
      return job
    },
  },

  Company: {
    jobs: (company) => getJobsByCompany(company.id),
  },

  Job: {
    date: (job) => toIsoDate(job.createdAt),
    company: ({ companyId }, _args, { companyLoader }) =>
      companyLoader.load(companyId),
  },
}

function notFoundError(message) {
  return new GraphQLError(message, {
    extensions: { code: 'NOT_FOUND' },
  })
}

function unauthorizedError(message) {
  return new GraphQLError(message, {
    extensions: { code: 'UNAUTHORIZED' },
  })
}

function toIsoDate(value) {
  return value.slice(0, 'yyyy-mm-dd'.length)
}
