import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route=createFileRoute('/companies_/$companyId/opportunities')({beforeLoad:({params})=>{throw redirect({to:'/opportunities',search:{company:params.companyId}});}});
