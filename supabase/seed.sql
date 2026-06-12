insert into public.companies (
  name,
  tax_id,
  default_currency
)
select
  'บริษัท วิจิตรโอสถ จำกัด',
  null,
  'THB'
where not exists (
  select 1
  from public.companies
  where name = 'บริษัท วิจิตรโอสถ จำกัด'
);
