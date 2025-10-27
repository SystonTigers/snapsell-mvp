create or replace function public.execute_sql(statement text)
returns void
language plpgsql
security definer
as $$
begin
  execute statement;
end;
$$;

revoke all on function public.execute_sql(text) from public;
grant execute on function public.execute_sql(text) to service_role;
